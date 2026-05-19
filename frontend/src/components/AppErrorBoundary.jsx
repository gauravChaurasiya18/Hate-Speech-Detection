import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center noise px-4">
        <div className="max-w-lg rounded-2xl border border-rose-400/30 bg-slate-950/90 p-6 text-center shadow-2xl">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-300" />
          <h1 className="text-2xl font-black text-white">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The interface hit an unexpected error. Refresh to reload the app state.
          </p>
          <Button className="mt-5" icon={RefreshCw} onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }
}
