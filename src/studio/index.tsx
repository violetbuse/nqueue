import { createRoot } from "react-dom/client";
import { App } from "./app";
import { ThemeProvider } from "./components/theme-provider";

const dom_node = document.getElementById("root");
if (!dom_node) {
  throw new Error("Root element not found");
}

const root = createRoot(dom_node);
root.render(
  <>
    <ThemeProvider defaultTheme="dark" storageKey="nqueue-studio-theme">
      <App />
    </ThemeProvider>
  </>
);
