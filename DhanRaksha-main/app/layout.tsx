import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist",
  fallback: ["system-ui", "arial", "sans-serif"]
})
const _geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: ["Consolas", "Monaco", "monospace"]
})

export const metadata: Metadata = {
  title: "Rupya Bank- AI-Powered Behavioral Verification for Banking",
  description: "Advanced fraud detection and continuous authentication with AI behavioral analysis",

  icons: {

  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
