import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro não tratado durante o render:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-6 text-center gap-4">
          <h1 className="text-xl font-bold text-zinc-200">Algo deu errado</h1>
          <p className="text-sm">Recarregue a página para tentar novamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-[#D4AF37] text-zinc-950 font-semibold hover:bg-[#C9A84C] transition-colors"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
