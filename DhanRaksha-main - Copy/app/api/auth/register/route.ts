export const runtime = "nodejs"
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, login } from '@/lib/auth'
import { z } from 'zod'

// Validation schema with strict requirements
const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
})

// Rate limiting using in-memory store (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function rateLimit(ip: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: Request) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
        
        // Apply rate limiting
        if (!rateLimit(ip, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                { status: 429 }
            )
        }

        const body = await request.json()
        
        // Validate input with detailed error messages
        const validation = registerSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }, { status: 400 })
        }

        const { name, email, password } = validation.data

        // Check if user exists with case-insensitive email
        const existingUser = await db.user.findFirst({
            where: { 
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            }
        })

        if (existingUser) {
            return NextResponse.json({ 
                error: 'User with this email already exists' 
            }, { status: 409 })
        }

        // Hash password with proper error handling
        const hashedPassword = await hashPassword(password)

        // Create user with initial account
        const user = await db.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'USER',
                updatedAt: new Date(),
                Account: {
                    create: {
                        balance: 0.00, // Removed sign-up bonus for security
                        currency: 'USD',
                        updatedAt: new Date(),
                    },
                },
            },
            include: {
                Account: true,
            }
        })

        // Auto-login after successful registration
        await login({ 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role 
        })

        // Return user data without sensitive information
        return NextResponse.json({ 
            success: true, 
            message: 'User created and logged in successfully',
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name,
                role: user.role,
                account: user.Account[0] ? {
                    balance: user.Account[0].balance,
                    currency: user.Account[0].currency,
                } : null
            } 
        })

    } catch (error: any) {
        console.error('Registration Error:', error)
        
        // Don't expose internal errors to client
        return NextResponse.json({ 
            error: 'Registration failed. Please try again.' 
        }, { status: 500 })
    }
}
