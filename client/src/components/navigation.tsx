import * as React from "react";
import { useLocation } from "wouter";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Tv, Smartphone, Settings, Image, Megaphone, Menu } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: "/", label: "TV Display", icon: <Tv className="h-4 w-4" /> },
  { path: "/mobile", label: "Mobile Control", icon: <Smartphone className="h-4 w-4" /> },
  { path: "/admin", label: "Admin Dashboard", icon: <Settings className="h-4 w-4" /> },
  { path: "/media", label: "Media Manager", icon: <Image className="h-4 w-4" /> },
  { path: "/promo", label: "Promo Manager", icon: <Megaphone className="h-4 w-4" /> },
];

// A small helper to close the sidebar on route change and on mobile interactions.
function useAutoCloseOnRoute() {
  const [location] = useLocation();
  const { setOpenMobile, openMobile } = useSidebar();

  React.useEffect(() => {
    if (openMobile) {
      // Close the mobile drawer when the route changes.
      setOpenMobile(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
}

// Close after 3 seconds of inactivity when the mobile sidebar is open.
function useAutoHideOnInactivity() {
  const { openMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    if (!openMobile) return;

    let timer: number | undefined;

    const reset = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setOpenMobile(false), 3000);
    };

    reset();

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));

    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, reset as EventListener));
    };
  }, [openMobile, setOpenMobile]);
}

function DrawerContents() {
  useAutoCloseOnRoute();
  useAutoHideOnInactivity();

  const [location, navigate] = useLocation();

  return (
    <SidebarContent className="bg-white">
      <SidebarHeader className="px-4 py-3 border-b">
        <div className="text-base font-semibold text-jewelry-primary">Menu</div>
        <div className="text-xs text-gray-500">Navigate between sections</div>
      </SidebarHeader>
      <nav className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const active = location === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={active}
                  className={cn(
                    "transition-colors",
                    active
                      ? "bg-gold-50 text-jewelry-primary"
                      : "text-gray-700 hover:text-jewelry-primary"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <span className="mr-2 inline-flex items-center">{item.icon}</span>
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </nav>
    </SidebarContent>
  );
}

export function Navigation() {
  // Render a floating hamburger button at the top-left and the sidebar drawer itself on all pages/devices.
  return (
    <SidebarProvider>
      {/* Hamburger trigger fixed at top-left with subtle shadow for visibility */}
      <div className="fixed top-3 left-3 z-50">
        <SidebarTrigger className="h-10 w-10 rounded-md bg-white shadow-md hover:bg-gold-50 text-jewelry-primary" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>

      {/* Left sidebar (mobile uses overlay/backdrop via Sheet; desktop uses offcanvas behavior) */}
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas" className="bg-white border-r">
        <DrawerContents />
      </Sidebar>
    </SidebarProvider>
  );
}
