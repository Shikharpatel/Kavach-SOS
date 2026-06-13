import * as React from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useLocation } from "wouter";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        <div className="flex items-center border-b border-border px-3">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <input 
            autoFocus
            className="flex-1 bg-transparent py-4 outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Search commands... (Press Esc to close)"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />
        </div>
        <div className="p-2 space-y-1">
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Navigation</p>
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Incidents", href: "/incidents" },
            { label: "AI Analysis", href: "/ai-analysis" }
          ].map(item => (
            <button
              key={item.href}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setLocation(item.href);
                setOpen(false);
              }}
            >
              Go to {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
