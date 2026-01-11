import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { getRecentTransactionsWithMetadata } from '@/lib/device-metadata'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get recent transactions with device metadata from in-memory storage
        const recentTransactions = getRecentTransactionsWithMetadata(session.id as string)
        
        // Filter only login sessions (transactionId starts with 'login_')
        let loginSessions = recentTransactions
            .filter(item => item.transactionId.startsWith('login_'))
            .map((item, index) => {
                const metadata = item.metadata
                return {
                    sessionId: metadata.sessionId || `session_${index + 1}`,
                    deviceInfo: {
                        userAgent: metadata.userAgent || 'Unknown',
                        browser: metadata.browser || 'Unknown',
                        os: metadata.os || 'Unknown',
                        platform: metadata.platform || 'Unknown',
                        deviceType: metadata.deviceType || 'Unknown'
                    },
                    networkInfo: {
                        ip: metadata.ip || 'Unknown',
                        country: metadata.country || 'Unknown',
                        city: metadata.city || 'Unknown',
                        region: metadata.region || 'Unknown',
                        isp: metadata.isp || 'Unknown',
                        timezone: metadata.timezone || 'Unknown'
                    },
                    timestamp: metadata.timestamp,
                    lastActivity: metadata.timestamp,
                    isActive: true, // Login sessions are considered active
                    loginTime: metadata.loginTime || metadata.timestamp,
                    transactionId: item.transactionId
                }
            })

        // If no login sessions found, create a current session from the request
        if (loginSessions.length === 0) {
            // Get real IP using ipify.org API
            let realIp = 'Unknown'
            let locationData = { 
                country: 'Unknown', 
                city: 'Unknown',
                region: 'Unknown',
                isp: 'Unknown',
                timezone: 'Unknown'
            }
            
            try {
                // Fetch real IP from ipify.org
                const ipResponse = await fetch('https://api.ipify.org?format=json')
                if (ipResponse.ok) {
                    const ipData = await ipResponse.json()
                    realIp = ipData.ip
                    
                    // Fetch detailed location data using IP (using ip-api.com free service with more fields)
                    const locationResponse = await fetch(`http://ip-api.com/json/${realIp}?fields=status,country,regionName,city,isp,timezone,lat,lon`)
                    if (locationResponse.ok) {
                        const locData = await locationResponse.json()
                        if (locData.status === 'success') {
                            locationData = {
                                country: locData.country || 'Unknown',
                                city: locData.city || 'Unknown',
                                region: locData.regionName || 'Unknown',
                                isp: locData.isp || 'Unknown',
                                timezone: locData.timezone || 'Unknown'
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch IP/location data:', error)
                // Fallback to request headers
                realIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                         request.headers.get('x-real-ip') || 
                         request.headers.get('cf-connecting-ip') ||
                         request.headers.get('x-client-ip') ||
                         'Unknown'
                
                locationData = {
                    country: request.headers.get('x-country') || 
                             request.headers.get('cf-ipcountry') || 
                             request.headers.get('x-geo-country') ||
                             request.headers.get('geoip-country') ||
                             'Unknown',
                    city: request.headers.get('x-city') || 
                          request.headers.get('cf-ipcity') ||
                          request.headers.get('geoip-city') ||
                          'Unknown',
                    region: 'Unknown',
                    isp: 'Unknown',
                    timezone: 'Unknown'
                }
            }

            const currentDeviceMetadata = {
                userAgent: request.headers.get('user-agent') || 'Unknown',
                browser: 'Unknown',
                os: 'Unknown',
                platform: 'Unknown',
                deviceType: 'Desktop',
                ip: realIp,
                country: locationData.country,
                city: locationData.city,
                region: locationData.region,
                isp: locationData.isp,
                timezone: locationData.timezone,
                timestamp: new Date().toISOString(),
                sessionId: `current_${Date.now()}`,
                loginTime: new Date().toISOString()
            }

            // Parse browser and OS from user agent
            const userAgent = currentDeviceMetadata.userAgent
            if (userAgent.includes('Chrome')) currentDeviceMetadata.browser = 'Chrome'
            else if (userAgent.includes('Firefox')) currentDeviceMetadata.browser = 'Firefox'
            else if (userAgent.includes('Safari')) currentDeviceMetadata.browser = 'Safari'
            else if (userAgent.includes('Edge')) currentDeviceMetadata.browser = 'Edge'

            if (userAgent.includes('Windows')) currentDeviceMetadata.os = 'Windows'
            else if (userAgent.includes('Mac')) currentDeviceMetadata.os = 'macOS'
            else if (userAgent.includes('Linux')) currentDeviceMetadata.os = 'Linux'
            else if (userAgent.includes('Android')) currentDeviceMetadata.os = 'Android'
            else if (userAgent.includes('iOS')) currentDeviceMetadata.os = 'iOS'

            if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
                currentDeviceMetadata.deviceType = 'Mobile'
            } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
                currentDeviceMetadata.deviceType = 'Tablet'
            }

            currentDeviceMetadata.platform = currentDeviceMetadata.os

            loginSessions = [{
                sessionId: currentDeviceMetadata.sessionId,
                deviceInfo: {
                    userAgent: currentDeviceMetadata.userAgent,
                    browser: currentDeviceMetadata.browser,
                    os: currentDeviceMetadata.os,
                    platform: currentDeviceMetadata.platform,
                    deviceType: currentDeviceMetadata.deviceType
                },
                networkInfo: {
                    ip: currentDeviceMetadata.ip,
                    country: currentDeviceMetadata.country,
                    city: currentDeviceMetadata.city,
                    region: currentDeviceMetadata.region,
                    isp: currentDeviceMetadata.isp,
                    timezone: currentDeviceMetadata.timezone
                },
                timestamp: currentDeviceMetadata.timestamp,
                lastActivity: currentDeviceMetadata.timestamp,
                isActive: true,
                loginTime: currentDeviceMetadata.loginTime,
                transactionId: 'current_session'
            }]
        }

        // Ensure we have at least 1 session (current) and up to 3 total
        const sessionsToShow = loginSessions.slice(0, 3)

        return NextResponse.json({
            success: true,
            sessions: sessionsToShow,
            debug: {
                totalLoginSessions: loginSessions.length,
                totalInMemory: recentTransactions.length,
                userId: session.id,
                hasStoredSessions: recentTransactions.some(item => item.transactionId.startsWith('login_'))
            },
            metadata: {
                totalSessions: sessionsToShow.length,
                dataSource: 'Non-Persistent (Login Sessions Only)',
                description: 'Session Metadata (Non-Persistent) - Extracted from login requests only'
            }
        })

    } catch (error: any) {
        console.error('Session Metadata API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// IP Detection:
// Service: ipify.org
// API: https://api.ipify.org?format=json
// Purpose: Gets the real public IP address
// Location Detection:
// Service: ip-api.com
// API: http://ip-api.com/json/{IP}?fields=status,country,regionName,city,isp,timezone
// Purpose: Provides geolocation data based on IP address