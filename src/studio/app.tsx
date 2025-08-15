import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";

export const App: React.FC = () => {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="nqueue-studio-theme">
        <ModeToggle />
      </ThemeProvider>
    </>
  );
};
