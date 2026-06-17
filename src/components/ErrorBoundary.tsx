"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("NEX Protocol Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-lg space-y-4">
            <h1 className="text-xl font-bold text-red-400">⚠️ Client Error Caught</h1>
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 font-mono text-xs overflow-auto">
              <p className="text-red-300 font-semibold">{this.state.error?.name}</p>
              <p className="text-red-200 mt-2">{this.state.error?.message}</p>
              {this.state.error?.stack && (
                <pre className="text-red-400/60 mt-2 text-[10px] whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
              {this.state.errorInfo && (
                <pre className="text-gray-500 mt-2 text-[10px] whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="text-xs px-4 py-2 rounded border border-white/20 hover:bg-white/5 transition-all"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
