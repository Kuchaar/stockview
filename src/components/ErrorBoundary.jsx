import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    // Class components can't use hooks — read lang from <html> or default to 'pl'
    const lang = typeof document !== 'undefined'
      ? (document.documentElement.lang || 'pl')
      : 'pl';

    const isPl = lang === 'pl';

    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="font-display font-bold text-lg">
            {isPl ? 'Co\u015b posz\u0142o nie tak' : 'Something went wrong'}
          </h2>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            {isPl
              ? 'Wyst\u0105pi\u0142 nieoczekiwany b\u0142\u0105d. Spr\u00f3buj od\u015bwie\u017cy\u0107 stron\u0119.'
              : 'An unexpected error occurred. Try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mx-auto"
          >
            {isPl ? 'Od\u015bwie\u017c stron\u0119' : 'Refresh page'}
          </button>
        </div>
      </div>
    );
  }
}
