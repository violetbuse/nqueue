import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/studio/components/ui/sidebar";
import { Separator } from "@/studio/components/ui/separator";
import { Button } from "@/studio/components/ui/button";
import { Sparkle } from "lucide-react";

type DashboardLayoutProps = {
  children: React.ReactNode;
  pageTitle: string;
};

export const DashboardLayout = ({
  children,
  pageTitle,
}: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="/">
                  <Sparkle className="!size-5" />
                  <span className="text-base font-semibold">Nqueue Studio</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent></SidebarContent>
        <SidebarFooter></SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <DashboardPageHeader pageTitle={pageTitle} />
      </SidebarInset>
    </SidebarProvider>
  );
};

type DashboardPageHeaderProps = {
  pageTitle: string;
};

const DashboardPageHeader = ({ pageTitle }: DashboardPageHeaderProps) => {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 py-2 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="/openapi/docs"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              OpenAPI Docs
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};
