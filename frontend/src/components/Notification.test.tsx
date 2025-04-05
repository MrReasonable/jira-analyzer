/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { Notification } from './Notification'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Notification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with the correct message and type', () => {
    render(() => <Notification message="Test notification" type="success" />)

    expect(screen.getByText('Test notification')).toBeInTheDocument()
    const alertDiv = screen.getByRole('alert')
    expect(alertDiv).toHaveClass('bg-green-100')
    expect(alertDiv).toHaveClass('text-green-800')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(() => <Notification message="Test notification" type="info" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('automatically closes after the specified duration', () => {
    const onClose = vi.fn()
    render(() => (
      <Notification message="Test notification" type="error" duration={2000} onClose={onClose} />
    ))

    expect(onClose).not.toHaveBeenCalled()

    // Fast-forward time
    vi.advanceTimersByTime(2000)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses the default duration if none is provided', () => {
    const onClose = vi.fn()
    render(() => <Notification message="Test notification" type="success" onClose={onClose} />)

    expect(onClose).not.toHaveBeenCalled()

    // Fast-forward time by default duration (3000ms)
    vi.advanceTimersByTime(3000)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders different styles based on notification type', () => {
    // Test success notification
    const { unmount: unmountSuccess } = render(() => (
      <Notification message="Success" type="success" />
    ))
    const successAlert = screen.getByRole('alert')
    expect(successAlert).toHaveClass('bg-green-100')
    unmountSuccess()

    // Clean up and test error notification
    const { unmount: unmountError } = render(() => <Notification message="Error" type="error" />)
    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toHaveClass('bg-red-100')
    unmountError()

    // Clean up and test info notification
    const { unmount: unmountInfo } = render(() => <Notification message="Info" type="info" />)
    const infoAlert = screen.getByRole('alert')
    expect(infoAlert).toHaveClass('bg-blue-100')
    unmountInfo()
  })
})
