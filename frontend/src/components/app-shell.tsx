import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  List,
  Settings,
  Bell,
  Search,
  Menu,
  Command,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Subscriptions", url: "/subscriptions", icon: List },
  { title: "Settings", url: "/settings", icon: Settings },
];

function AppSidebar() {
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background">
      <SidebarContent className="gap-0">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Command className="h-4 w-4" />
            </div>
            <span className="group-data-[collapsible=icon]:hidden">Mayday</span>
          </Link>
        </div>
        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function MobileNav() {
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });

  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Command className="h-4 w-4" />
            </div>
            <span>Mayday</span>
          </Link>
        </div>
        <nav className="grid gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                currentPath === item.url || (item.url !== "/" && currentPath.startsWith(item.url))
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 lg:hidden">
        <MobileNav />
      </div>
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger className="hidden lg:flex" />
        <div className="relative hidden max-w-md flex-1 md:flex">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search subscriptions..."
            className="w-full rounded-md bg-muted pl-8 focus:bg-background"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground md:flex">
          JD
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
