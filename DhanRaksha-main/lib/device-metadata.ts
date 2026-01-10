import type { NextRequest } from 'next/server'

export interface DeviceMetadata {
  userAgent?: string
  browser?: string
  os?: string
  platform?: string
  deviceType?: string
  ip?: string
  country?: string
  city?: string
  region?: string
  isp?: string
  timezone?: string
  timestamp: string
  // Session-specific metadata
  sessionId?: string
  loginTime?: string
  requestPath?: string
  httpMethod?: string
}

export async function extractDeviceMetadata(request: NextRequest): Promise<DeviceMetadata> {
  const userAgent = request.headers.get('user-agent') || ''
  const forwarded = request.headers.get('x-forwarded-for')
  const headerIp = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  
  // Get real IP using IPify API
  let realIp = headerIp
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
  
  // Parse User-Agent to extract browser and OS info
  let browser = 'Unknown'
  let os = 'Unknown'
  let deviceType = 'Desktop'
  
  if (userAgent) {
    // Browser detection
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'
    else if (userAgent.includes('Opera')) browser = 'Opera'
    
    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'
    
    // Device type detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      deviceType = 'Mobile'
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceType = 'Tablet'
    }
  }
  
  // Generate session ID based on user agent and IP for consistency
  const sessionSeed = `${userAgent}_${realIp}_${new Date().toDateString()}`
  const sessionId = Buffer.from(sessionSeed).toString('base64').substring(0, 16)
  
  return {
    userAgent,
    browser,
    os,
    platform: os,
    deviceType,
    ip: realIp,
    country: locationData.country,
    city: locationData.city,
    region: locationData.region,
    isp: locationData.isp,
    timezone: locationData.timezone,
    timestamp: new Date().toISOString(),
    // Session-specific metadata
    sessionId,
    loginTime: new Date().toISOString(),
    requestPath: request.nextUrl.pathname,
    httpMethod: request.method
  }
}

// In-memory storage for recent transactions with device metadata
const recentTransactionsWithMetadata = new Map<string, { transactionId: string; userId: string; metadata: DeviceMetadata }>()

export function storeTransactionMetadata(transactionId: string, metadata: DeviceMetadata, userId?: string) {
  // Keep only last 5 transactions per user in memory
  const key = `tx_${transactionId}`
  recentTransactionsWithMetadata.set(key, { transactionId, userId: userId || 'unknown', metadata })
  
  // Clean up old entries (keep only recent ones)
  if (recentTransactionsWithMetadata.size > 50) {
    const entries = Array.from(recentTransactionsWithMetadata.entries())
    const recentEntries = entries.slice(-40) // Keep last 40 entries
    recentTransactionsWithMetadata.clear()
    recentEntries.forEach(([k, v]) => recentTransactionsWithMetadata.set(k, v))
  }
}

export function getRecentTransactionsWithMetadata(userId: string): Array<{ transactionId: string; metadata: DeviceMetadata }> {
  const allEntries = Array.from(recentTransactionsWithMetadata.values())
  // Filter by user ID and return last 5
  const userEntries = allEntries.filter(entry => entry.userId === userId)
  return userEntries.slice(-5).map(entry => ({
    transactionId: entry.transactionId,
    metadata: entry.metadata
  }))
}

export function getTransactionMetadata(transactionId: string): DeviceMetadata | null {
  const key = `tx_${transactionId}`
  const entry = recentTransactionsWithMetadata.get(key)
  return entry ? entry.metadata : null
}
