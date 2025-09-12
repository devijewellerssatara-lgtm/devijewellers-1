import * as React from "react";
import { Link, useLocation } from "wouter";
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

// Auto-hide on inactivity disabled on mobile to avoid premature closing while trying to tap.
// If needed later, re-introduce with a longer timeout and sidebar-specific event targets.

function DrawerContents() {
  const { setOpenMobile } = useSidebar();
  const [location] = useLocation();

  const handleNavigate = React.useCallback(() => {
    // Close the mobile drawer explicitly after a tiny delay to avoid event overlap.
    setTimeout(() => setOpenMobile(false), 50);
  }, [setOpenMobile]);

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
                  asChild
                  isActive={active}
                  className={cn(
                    "transition-colors",
                    active
                      ? "bg-gold-50 text-jewelry-primary"
                      : "text-gray-700 hover:text-jewelry-primary"
                  )}
                >
                  <Link href={item.path} onClick={handleNavigate}>
                    <span className="mr-2 inline-flex items-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
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
  // Keep desktop open state stable across route changes by controlling the provider's open prop.
  const [open, setOpen] = React.useState(false);

  // Prevent immediate close from the same touch by ignoring the first outside pointer after open.
  const justOpenedAt = React.useRef<number | null>(null);

  // A trigger that hides itself when the mobile drawer is open to prevent accidental immediate close.
  function MobileAwareTrigger({ setDesktopOpen }: { setDesktopOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
    const { isMobile, openMobile, setOpenMobile } = useSidebar();
    const hidden = isMobile && openMobile;

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isMobile) {
        justOpenedAt.current = Date.now();
        // Open explicitly on mobile to avoid double-toggle close.
        setOpenMobile(true);
      } else {
        setDesktopOpen((v) => !v);
      }
    };

    return (
      <div className={cn("fixed top-3 left-3 z-[51] pointer-events-auto transition-opacity", hidden ? "opacity-0 pointer-events-none" : "opacity-100")}>
        <button
          type="button"
          onClick={handleClick}
          className="h-10 w-10 inline-flex items-center justify-center rounded-md bg-white shadow-md hover:bg-gold-50 text-jewelry-primary"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Render a floating hamburger button at the top-left and the sidebar drawer itself on all pages/devices.
  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className="fixed inset-0 pointer-events-none z-50">
      {/* Hamburger trigger fixed at top-left with subtle shadow for visibility */}
      <MobileAwareTrigger setDesktopOpen={setOpen} />

      {/* Left sidebar (mobile uses overlay/backdrop via Sheet; desktop uses offcanvas behavior) */}
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="offcanvas"
        className="bg-white border-r pointer-events-auto"
        // Prevent the first outside pointer immediately after opening from closing the sheet.
        onPointerDownOutside={(e: any) => {
          if (justOpenedAt.current && Date.now() - justOpenedAt.current < 250) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e: any) => {
          if (justOpenedAt.current && Date.now() - justOpenedAt.current < 250) {
            e.preventDefault();
          }
        }}
      >
        <DrawerContents />
      </Sidebar>
    </SidebarProvider>
  );
}
