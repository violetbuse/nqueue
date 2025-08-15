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
  SidebarGroup,
} from "@/studio/components/ui/sidebar";
import { Separator } from "@/studio/components/ui/separator";
import { Button } from "@/studio/components/ui/button";
import { Calendar, Plus, Send, Server, Sparkle, Table } from "lucide-react";
import { Link, useLocation } from "wouter";

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
      <DashboardSidebar />
      <SidebarInset>
        <DashboardPageHeader pageTitle={pageTitle} />
        <div className="px-4 py-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

const DashboardSidebar = () => {
  const [location] = useLocation();

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Sparkle className="!size-5" />
                <span className="text-base font-semibold">Nqueue Studio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Create"
              className="mb-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <Plus />
              <span>Quick Create</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.startsWith("/messages")}
                asChild
              >
                <Link href="/messages">
                  <Send />
                  Messages
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.startsWith("/queues")}
                asChild
              >
                <Link href="/queues">
                  <Table />
                  Queues
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.startsWith("/crons")}
                asChild
              >
                <Link href="/crons">
                  <Calendar />
                  Crons
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.startsWith("/scheduled-jobs")}
                asChild
              >
                <Link href="/scheduled-jobs">
                  <Server />
                  Scheduled Jobs
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
};

type DashboardPageHeaderProps = {
  pageTitle: string;
};

const DashboardPageHeader = ({ pageTitle }: DashboardPageHeaderProps) => {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-2 py-2 lg:gap-2 lg:px-6">
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
