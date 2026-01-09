import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

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
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*'],
}
