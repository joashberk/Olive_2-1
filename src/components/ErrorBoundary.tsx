import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
          <img 
            src="/jar/Error-Jar-of-Oil-02-B.png" 
            alt="Error illustration" 
            className="w-48 h-48 mb-6 opacity-50"
          />
          <h2 className="text-2xl font-serif text-dark-100 mb-3">
            Something went wrong
          </h2>
          <p className="text-dark-300 mb-6 max-w-md">
            We're having trouble loading this page. Please try refreshing or check back later.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-olive-900/30 text-olive-300 rounded-lg hover:bg-olive-900/50 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                const feedbackButton = document.querySelector('[data-feedback-button]');
                if (feedbackButton instanceof HTMLElement) {
                  feedbackButton.click();
                }
              }}
              className="px-4 py-2 bg-dark-700 text-dark-300 rounded-lg hover:bg-dark-600 transition-colors"
            >
              Send Feedback
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 