import { Component } from 'react'
import AppRecoveryFallback from './AppRecoveryFallback.jsx'
import { clearChunkReloadAttempt, handleChunkLoadError } from '../../utils/chunkRecovery.js'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[dna-gestao] erro_renderizacao', error, errorInfo)
    handleChunkLoadError(error, 'error_boundary')
  }

  handleRetry = () => {
    clearChunkReloadAttempt()
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return <AppRecoveryFallback onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}
