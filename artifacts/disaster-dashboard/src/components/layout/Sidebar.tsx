import { Link, useLocation } from "wouter";
import {
  Monitor,
  AlertTriangle,
  Cpu,
  Home,
  Navigation,
  BarChart2,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "OPERATIONS",
    items: [
      { href: "/dashboard", label: "Command Center", icon: Monitor },
      { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    ],
  },
  {
    label: "LOGISTICS",
    items: [
      { href: "/resources", label: "Resource Engine", icon: Cpu },
      { href: "/shelters", label: "Shelters", icon: Home },
      { href: "/rescue-routes", label: "Rescue Routing", icon: Navigation },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/admin", label: "Admin Panel", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-56 bg-sidebar border-r border-sidebar-border h-full flex flex-col relative z-20 shrink-0">
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Shield className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground group-hover:text-orange-400 transition-colors block leading-tight">
              Kavach SOS
            </span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Emergency Platform</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  location === item.href ||
                  location.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all text-sm",
                      isActive
                        ? "bg-orange-500/10 text-orange-400 font-medium"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground font-normal"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-orange-400" : "text-muted-foreground/60"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border/50">
        <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed">
          built with love by Team 9/11&nbsp;❤️&nbsp;❤️&nbsp;✈️
        </p>
      </div>
    </div>
  );
}
