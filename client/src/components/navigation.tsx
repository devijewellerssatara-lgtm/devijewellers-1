import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "TV Display", icon: "fas fa-tv" },
  { path: "/mobile", label: "Mobile Control", icon: "fas fa-mobile-alt" },
  { path: "/admin", label: "Admin Dashboard", icon: "fas fa-cog" },
  { path: "/media", label: "Media Manager", icon: "fas fa-images" },
  { path: "/promo", label: "Promo Manager", icon: "fas fa-bullhorn" },
];

export function Navigation() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const inactivityTimer = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close menu on route change (useful for mobile)
  useEffect(() => {
    setOpen(false);
  }, [location]);

  // Auto-hide after inactivity when open (mobile-friendly)
  useEffect(() => {
    if (!open) {
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = window.setTimeout(() => {
        setOpen(false);
      }, 3000); // 3s inactivity
    };

    // Start the timer when opened
    resetTimer();

    const panel = panelRef.current;
    const events: Array<keyof DocumentEventMap> = [
      "mousemove",
      "mousedown",
      "touchstart",
      "wheel",
      "keydown",
    ];

    const handler = () => resetTimer();

    events.forEach((evt) =>
      (panel || document).addEventListener(evt, handler, { passive: true }),
    );

    return () => {
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      events.forEach((evt) =>
        (panel || document).removeEventListener(evt, handler),
      );
    };
  }, [open]);

  return (
    <>
      {/* Toggle button (top-left), always visible */}
      <button
        aria-label="Toggle menu"
        className={cn(
          "fixed left-3 top-3 z-50 rounded-md bg-white/90 text-gray-700 shadow-md ring-1 ring-gray-200 px-3 py-2",
          "hover:bg-gold-50 hover:text-jewelry-primary transition-colors",
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Simple hamburger icon */}
        <span className="block w-5 h-0.5 bg-current mb-1"></span>
        <span className="block w-5 h-0.5 bg-current mb-1"></span>
        <span className="block w-5 h-0.5 bg-current"></span>
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
      />

      {/* Left sidebar panel */}
      <aside
        ref={panelRef}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-64 bg-white shadow-xl ring-1 ring-gray-200",
          "transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 px-4 flex items-center border-b">
          <span className="text-lg font-semibold text-jewelry-primary">
            Controls
          </span>
          <span className="ml-2 text-xs rounded px-2 py-1 bg-gold-50 text-jewelry-primary border border-gold-200">
            v1.1 Drawer
          </span>
        </div>

        <nav className="py-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                  location === item.path
                    ? "bg-gold-50 text-jewelry-primary font-semibold"
                    : "text-gray-700 hover:bg-gold-50 hover:text-jewelry-primary",
                )}
                onClick={() => setOpen(false)}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
