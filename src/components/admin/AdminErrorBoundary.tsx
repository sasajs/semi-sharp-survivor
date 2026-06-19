import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught admin dashboard error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div id="admin-error-boundary-container" className="p-8 bg-slate-50 border border-slate-200 rounded-2xl max-w-4xl mx-auto my-12 shadow-sm font-sans">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shrink-0">
              <AlertOctagon className="w-8 h-8 text-rose-600 animate-pulse" />
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[9px] font-black tracking-widest text-rose-500 uppercase font-mono bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                  Dashboard Incident Logged
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Administrative Area Halted
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  The frontend encountered an unexpected rendering or calculation exception. This safety boundary prevented a full white-screen crash of the parent viewport.
                </p>
              </div>

              {this.state.error && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-rose-400 overflow-x-auto space-y-2 max-w-full">
                  <p className="font-extrabold text-slate-400 border-b border-slate-800 pb-1 mb-1">
                    EXCEPTION DETAIL:
                  </p>
                  <p className="font-black text-rose-300">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2 text-slate-400 cursor-pointer">
                      <summary className="hover:text-slate-300">View detailed stacktrace</summary>
                      <pre className="mt-2 text-[9px] leading-relaxed select-text overflow-x-auto pr-2 max-h-[180px]">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reload Admin Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Dismiss Boundary
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
