/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NotificationManager, showNotification, removeNotification } from './NotificationManager'

describe('NotificationManager', () => {
  // Create a function to reset notifications state
  const resetNotifications = () => {
    // Use the exported removeNotification function to clear all notifications
    // This is more reliable than trying to click buttons
    const notificationsArray = screen.queryAllByRole('alert')
    notificationsArray.forEach(() => {
      // Since we can't access the internal notifications array directly,
      // we'll use the component's unmount/remount to reset state
      document.body.innerHTML = ''
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    resetNotifications()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders without notifications initially', () => {
    render(() => <NotificationManager />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a notification when showNotification is called', () => {
    render(() => <NotificationManager />)

    // Initially no notifications
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    // Show a notification
    showNotification('Test notification', 'success')

    // Check notification is displayed
    expect(screen.getByText('Test notification')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-green-100')

    // Notification should be removed after duration
    vi.advanceTimersByTime(3000)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('can show multiple notifications', () => {
    render(() => <NotificationManager />)

    // Show multiple notifications
    showNotification('First notification', 'success')
    showNotification('Second notification', 'error')

    // Check both notifications are displayed
    expect(screen.getByText('First notification')).toBeInTheDocument()
    expect(screen.getByText('Second notification')).toBeInTheDocument()

    const alerts = screen.getAllByRole('alert')
    expect(alerts.length).toBe(2)

    // First notification should be success type
    expect(alerts[0]).toHaveClass('bg-green-100')

    // Second notification should be error type
    expect(alerts[1]).toHaveClass('bg-red-100')
  })

  it('removes a notification when removeNotification is called', () => {
    render(() => <NotificationManager />)

    // Show a notification and get its ID
    const notificationId = showNotification('Test notification')
    expect(screen.getByText('Test notification')).toBeInTheDocument()

    // Remove the notification
    removeNotification(notificationId)

    // Check notification is removed
    expect(screen.queryByText('Test notification')).not.toBeInTheDocument()
  })

  it('uses default type and duration when not provided', () => {
    // Start with a clean slate for this test
    document.body.innerHTML = ''
    render(() => <NotificationManager />)

    // Show notification without specifying type or duration
    showNotification('Default notification')

    // Check notification has default type (info) by finding it by text content
    const alert = screen.getByText('Default notification').closest('[role="alert"]')
    expect(alert).toHaveClass('bg-blue-100')

    // Should be removed after default duration (3000ms)
    vi.advanceTimersByTime(3000)
    expect(screen.queryByText('Default notification')).not.toBeInTheDocument()
  })
})
