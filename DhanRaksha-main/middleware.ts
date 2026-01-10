import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { extractDeviceMetadata } from '@/lib/device-metadata'

export async function middleware(request: NextRequest) {
    // Check if accessing dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('session')?.value

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Track behavior session for dashboard access
        try {
            const deviceMetadata = extractDeviceMetadata(request)
            
            // Create a simple behavior score based on various factors
            let behaviorScore = 50 // Base score
            
            // Adjust score based on time of day (unusual hours = higher risk)
            const currentHour = new Date().getHours()
            if (currentHour < 6 || currentHour > 22) {
                behaviorScore += 10
            }
            
            // Adjust score based on device consistency (simplified)
            if (deviceMetadata.deviceType === 'Mobile') {
                behaviorScore += 5
            }
            
            // Determine risk level
            let riskLevel = 'LOW'
            if (behaviorScore > 70) riskLevel = 'HIGH'
            else if (behaviorScore > 55) riskLevel = 'MEDIUM'
            
            // Store behavior session data in a custom header for the API to process
            const response = NextResponse.next()
            response.headers.set('x-behavior-score', behaviorScore.toString())
            response.headers.set('x-behavior-risk', riskLevel)
            response.headers.set('x-device-type', deviceMetadata.deviceType || 'Unknown')
            response.headers.set('x-device-ip', deviceMetadata.ip || 'Unknown')
            
            return response
            
        } catch (error) {
            console.error('Behavior tracking error:', error)
            return NextResponse.next()
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*'],
}
