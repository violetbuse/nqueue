import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { DashboardLayout } from "./layouts/dashboard";

export const App: React.FC = () => {
  return (
    <>
      <DashboardLayout pageTitle="hello">
        <div>hello</div>
      </DashboardLayout>
    </>
  );
};
