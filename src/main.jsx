import React from "react";
import ReactDOM from "react-dom/client";
import AppRoot from "./AppRoot.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRoot />
    </ErrorBoundary>
  </React.StrictMode>,
);
