import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const dom_node = document.getElementById("root");
if (!dom_node) {
  throw new Error("Root element not found");
}

const root = createRoot(dom_node);
root.render(<App />);
