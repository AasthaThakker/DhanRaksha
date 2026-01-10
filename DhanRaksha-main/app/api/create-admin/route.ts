import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { z } from 'zod'

// Validation schema for admin creation
const createAdminSchema = z.object({
  adminKey: z.string().min(1, 'Admin key is required'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional()
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        // Validate input
        const validation = createAdminSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }, { status: 400 })
        }

        const { adminKey, email, password, name } = validation.data

        // Verify admin key (in production, use environment variable)
        const expectedAdminKey = process.env.ADMIN_CREATION_KEY || 'secure-admin-key-2024'
        if (adminKey !== expectedAdminKey) {
            return NextResponse.json({ 
                error: 'Invalid admin key' 
            }, { status: 403 })
        }

        // Use provided values or defaults
        const adminEmail = email || 'admin@banking.com'
        const adminPassword = password || 'password@123'
        const adminName = name || 'Admin User'

        // Check if admin already exists
        const existingAdmin = await db.user.findFirst({
            where: { 
                email: {
                    equals: adminEmail,
                    mode: 'insensitive'
                }
            }
        })
        
        if (existingAdmin) {
            // Update existing admin password and ensure admin role
            const hashedPassword = await hash(adminPassword, 10)
            await db.user.update({
                where: { id: existingAdmin.id },
                data: { 
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            })
            
            return NextResponse.json({ 
                message: 'Admin user updated successfully!',
                email: adminEmail,
                role: 'ADMIN'
            })
        } else {
            // Create new admin user
            const hashedPassword = await hash(adminPassword, 10)
            const admin = await db.user.create({
                data: {
                    email: adminEmail.toLowerCase(),
                    password: hashedPassword,
                    name: adminName.trim(),
                    role: 'ADMIN',
                },
            })
            
            return NextResponse.json({ 
                message: 'Admin user created successfully!',
                email: admin.email,
                role: admin.role,
                id: admin.id
            })
        }
        
    } catch (error: any) {
        console.error('Error creating admin:', error)
        return NextResponse.json({ 
            error: 'Failed to create admin user',
            message: 'Internal server error'
        }, { status: 500 })
    }
}
