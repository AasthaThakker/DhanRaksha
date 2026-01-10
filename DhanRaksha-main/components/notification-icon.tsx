"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationPanel } from './notification-panel'
import { api } from '@/lib/api'

export function NotificationIcon() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getNotifications()
      setUnreadCount(response.unreadCount)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const togglePanel = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePanel}
        className="relative p-2 hover:bg-blue-50 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-lg shadow-blue-500/25">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      
      {isOpen && createPortal(
        <NotificationPanel 
          isOpen={isOpen} 
          onClose={() => {
            setIsOpen(false)
            // Refresh unread count when panel closes
            fetchUnreadCount()
          }} 
        />,
        document.body
      )}
    </>
  )
}
