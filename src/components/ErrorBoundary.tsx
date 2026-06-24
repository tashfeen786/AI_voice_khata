import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-danger/10 text-danger grid place-items-center">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{this.state.error?.message || "An unexpected error occurred"}</p>
          <Button onClick={() => this.setState({ hasError: false, error: undefined })} className="rounded-xl">
            Try again
          </Button>
        </div>
      </div>
    );
  }
}