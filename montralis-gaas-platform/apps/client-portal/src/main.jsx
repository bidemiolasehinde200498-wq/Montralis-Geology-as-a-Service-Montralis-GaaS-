import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

class PortalErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('Client portal render failed:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', alignContent: 'center', gap: 12, padding: 24, background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
          <h1>Client portal failed to render</h1>
          <pre style={{ maxWidth: 800, whiteSpace: 'pre-wrap', color: '#fda4af' }}>{this.state.error.stack || this.state.error.message}</pre>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PortalErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </PortalErrorBoundary>
  </React.StrictMode>
);
