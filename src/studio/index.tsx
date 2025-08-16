import { createRoot } from "react-dom/client";
import { App } from "./app";
import { ThemeProvider } from "./components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const dom_node = document.getElementById("root");
if (!dom_node) {
  throw new Error("Root element not found");
}

const root = createRoot(dom_node);

const query_client = new QueryClient();

root.render(
  <QueryClientProvider client={query_client}>
    <ThemeProvider defaultTheme="dark" storageKey="nqueue-studio-theme">
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
