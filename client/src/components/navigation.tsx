import React from "react";
import { Link, useLocation } from "wouter";
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
  { path: "/rates-sync", label: "Rate Sync", icon: "fas fa-percentage" }
];

export function Navigation() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-start overflow-x-auto relative">
          {/* Hamburger menu */}
          <button
            aria-label="Open menu"
            className="px-4 py-4 border-b-2 border-transparent text-gray-700 hover:text-jewelry-primary"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Inline nav items left-aligned */}
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex-shrink-0 px-4 py-4 text-center border-b-2 transition-colors",
                  location === item.path
                    ? "border-gold-500 bg-gold-50 text-jewelry-primary font-semibold"
                    : "border-transparent hover:border-gold-300 text-gray-600 hover:text-jewelry-primary"
                )}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </button>
            </Link>
          ))}

          {/* Dropdown menu with all pages */}
          {menuOpen && (
            <div className="absolute top-full left-0 bg-white shadow-lg border w-64 z-50">
              {navItems.map((item) => (
                <Link key={`menu-${item.path}`} href={item.path}>
                  <button
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gold-50",
                      location === item.path ? "text-jewelry-primary font-semibold" : "text-gray-700"
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className={`${item.icon} mr-2`}></i>
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
