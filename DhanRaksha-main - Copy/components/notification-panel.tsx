"use client"

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertTriangle, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'

interface Notification {
  id: string
  title: string
  message: string
  type: 'MONEY_DEDUCTED' | 'PAYMENT_PENDING' | 'TRANSACTION_COMPLETED' | 'USER_FLAGGED' | 'SYSTEM_ALERT'
  isRead: boolean
  createdAt: string
  transaction?: {
    id: string
    amount: number
    type: string
    description: string
    date: string
  }
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.getNotifications()
      setNotifications(response.notifications)
      setUnreadCount(response.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await api.markNotificationsRead(notificationIds)
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MONEY_DEDUCTED':
        return <DollarSign className="w-4 h-4 text-red-500" />
      case 'PAYMENT_PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'TRANSACTION_COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'USER_FLAGGED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0" style={{ zIndex: 999999999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" style={{ zIndex: 999999998 }} onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-96 bg-white/95 backdrop-blur-xl shadow-2xl shadow-blue-500/20 border-l border-blue-100 overflow-y-auto" style={{ zIndex: 999999999 }}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-white/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg shadow-blue-500/25">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-hidden">
            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-80px)]">
              {loading ? (
                <div className="text-center py-8 text-slate-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 ${
                      !notification.isRead 
                        ? 'bg-blue-50/80 backdrop-blur-sm border-blue-200' 
                        : 'bg-white/60 backdrop-blur-sm border-blue-100'
                    }`}
                    onClick={() => !notification.isRead && markAsRead([notification.id])}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-medium truncate ${
                            !notification.isRead ? 'text-slate-800' : 'text-slate-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.transaction && (
                            <span className="text-xs text-slate-500">
                              ₹{notification.transaction.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
