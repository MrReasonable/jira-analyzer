import { Component, createSignal, For } from 'solid-js'
import { Notification } from './Notification'

// Define notification type
export interface NotificationItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

// Create a singleton for managing notifications
const [notifications, setNotifications] = createSignal<NotificationItem[]>([])

// Function to add a notification
export function showNotification(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration = 3000
) {
  const id = Math.random().toString(36).substring(2, 9)
  const notification: NotificationItem = { id, message, type, duration }

  setNotifications(prev => [...prev, notification])

  return id
}

// Function to remove a notification
export function removeNotification(id: string) {
  setNotifications(prev => prev.filter(notification => notification.id !== id))
}

// Component to render all notifications
export const NotificationManager: Component = () => {
  return (
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <For each={notifications()}>
        {notification => (
          <Notification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        )}
      </For>
    </div>
  )
}
