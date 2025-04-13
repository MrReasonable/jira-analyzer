import { Component, createSignal, onCleanup, Show, createEffect } from 'solid-js'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export const Notification: Component<NotificationProps> = props => {
  const [visible, setVisible] = createSignal(true)
  let timeout: number | undefined

  // Auto-hide the notification after duration using createEffect for reactivity
  createEffect(() => {
    // Clear any existing timeout
    if (timeout) clearTimeout(timeout)

    // Set new timeout
    timeout = setTimeout(() => {
      setVisible(false)
      if (props.onClose) props.onClose()
    }, props.duration ?? 3000) as unknown as number
  })

  // Clean up timeout on component unmount
  onCleanup(() => {
    if (timeout) clearTimeout(timeout)
  })

  // Get the appropriate background color based on notification type
  const getBgColor = () => {
    switch (props.type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800'
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800'
      case 'info':
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800'
    }
  }

  // Get the appropriate icon based on notification type
  const getIcon = () => {
    switch (props.type) {
      case 'success':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        )
      case 'error':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        )
    }
  }

  return (
    <Show when={visible()}>
      <div
        class={`fixed top-4 right-4 z-50 flex items-center rounded-lg border-l-4 p-4 shadow-md ${getBgColor()}`}
        role="alert"
      >
        <div class="mr-2">{getIcon()}</div>
        <div>{props.message}</div>
        <button
          class="ml-4 text-gray-500 hover:text-gray-800"
          onClick={() => {
            setVisible(false)
            if (props.onClose) props.onClose()
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </Show>
  )
}
