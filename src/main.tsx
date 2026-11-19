import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { StoreProvider } from "./store";
import "./styles.css";

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="crash">
          Something went wrong on screen. Reload this page. Logs already saved on this phone are still there.
        </p>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <Boundary>
        <App />
      </Boundary>
    </StoreProvider>
  </StrictMode>,
);
