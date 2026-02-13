import React, { Component, ErrorInfo } from 'react';
import { Bug, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReportError?: (error: { mensagem_erro: string; stack_trace: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReport = () => {
    const { error } = this.state;
    if (error && this.props.onReportError) {
      this.props.onReportError({
        mensagem_erro: error.message,
        stack_trace: error.stack || '',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Bug className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Algo correu mal
            </h2>
            <p className="text-gray-500 mb-4">
              Ocorreu um erro inesperado. Pode tentar recarregar ou reportar o problema.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-gray-100 rounded-md p-3 mb-4 overflow-auto max-h-32 text-red-600">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar de novo
              </button>
              {this.props.onReportError && (
                <button
                  onClick={this.handleReport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  <Bug className="h-4 w-4" />
                  Reportar Erro
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
