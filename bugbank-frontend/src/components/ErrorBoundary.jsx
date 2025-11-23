import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null, showDetails: false, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === "function") {
      try { this.props.onError(error, info); } catch {}
    }
    // Always log in dev tools
    console.error("UI Error:", error, info);
    this.setState({ info });
  }

  componentDidUpdate(prevProps) {
    const { resetKeys } = this.props;
    if (this.state.hasError && Array.isArray(resetKeys) && Array.isArray(prevProps.resetKeys)) {
      const changed =
        resetKeys.length !== prevProps.resetKeys.length ||
        resetKeys.some((val, i) => Object.is(val, prevProps.resetKeys[i]) === false);
      if (changed) this.handleReset();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null, showDetails: false, copied: false });
    if (typeof this.props.onReset === "function") {
      try { this.props.onReset(); } catch {}
    }
  };

  copyDetails = async () => {
    const { error, info } = this.state;
    const text = [
      "ErrorBoundary details:",
      error ? String(error.stack || error) : "",
      info?.componentStack || "",
    ].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    } catch {}
  };

  render() {
    // Simple, valid checks for dev mode
    const isDev =
      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
      (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production");

    if (this.state.hasError) {
      const { error, info, showDetails, copied } = this.state;

      return (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="text-xl">⚠️</div>
            <div className="flex-1">
              <div className="font-semibold text-red-800 dark:text-red-300">
                Something went wrong.
              </div>
              <div className="text-xs text-red-700/80 dark:text-red-400">
                Try again. If the issue persists, please reload the page.
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={this.handleReset}
                  className="rounded-lg bg-red-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-red-700 transition"
                >
                  Try again
                </button>

                {isDev && (
                  <>
                    <button
                      onClick={() => this.setState({ showDetails: !showDetails })}
                      className="rounded-lg border border-red-500/40 bg-white/60 dark:bg-white/10 text-red-800 dark:text-red-200 text-sm px-3 py-1.5 hover:bg-white transition"
                    >
                      {showDetails ? "Hide details" : "Show details"}
                    </button>
                    {showDetails && (
                      <button
                        onClick={this.copyDetails}
                        className="rounded-lg border border-red-500/40 bg-white/60 dark:bg-white/10 text-red-800 dark:text-red-200 text-sm px-3 py-1.5 hover:bg-white transition"
                      >
                        {copied ? "Copied!" : "Copy details"}
                      </button>
                    )}
                  </>
                )}
              </div>

              {isDev && showDetails && (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-800/90 dark:text-red-200/90 overflow-auto">
                  {error && (
                    <>
                      <div className="font-semibold mb-1">Error</div>
                      <pre className="whitespace-pre-wrap">{String(error?.stack || error)}</pre>
                    </>
                  )}
                  {info?.componentStack && (
                    <>
                      <div className="font-semibold mt-3 mb-1">Component stack</div>
                      <pre className="whitespace-pre-wrap">{info.componentStack}</pre>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
