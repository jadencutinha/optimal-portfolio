import { Component, type ReactNode } from 'react'

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled UI error', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="workspace-error">
          <p className="error">Something went wrong.</p>
          <button type="button" className="signin-trigger" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
