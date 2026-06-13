import { ReactNode, useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "../CommandPalette";
import { Bell, Search, AlertTriangle, X, Clock, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListIncidents } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-400",
  active: "bg-orange-400",
  monitoring: "bg-yellow-400",
  resolved: "bg-green-400",
};

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { data: incidents } = useListIncidents();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const alerts = incidents
    ? [...incidents]
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 8)
    : [];

  const criticalCount = alerts.filter((i: any) => i.status === "critical").length;
  const activeCount = alerts.filter((i: any) => i.status === "active").length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold">Live Alerts</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {criticalCount} critical · {activeCount} active incidents
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
        {alerts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No active alerts</div>
        )}
        {alerts.map((inc: any) => (
          <div key={inc.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
            <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", SEVERITY_DOT[inc.status] ?? "bg-muted")} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground leading-snug truncate">{inc.title}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {(inc as any).region ?? "Unknown region"}
                </span>
                <span>·</span>
                <span>Severity {inc.severity}/10</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded capitalize shrink-0",
              inc.status === "critical" ? "bg-red-500/20 text-red-400" :
              inc.status === "active" ? "bg-orange-500/20 text-orange-400" :
              inc.status === "monitoring" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-green-500/20 text-green-400"
            )}>
              {inc.status}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-border bg-muted/5">
        <p className="text-[10px] text-muted-foreground text-center">
          Kavach SOS · Real-time emergency alerts
        </p>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: ReactNode }) {
  const [sosMode, setSosMode] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const { data: incidents } = useListIncidents();

  const unreadCount = incidents?.filter(
    (i: any) => i.status === "critical" || i.status === "active"
  ).length ?? 0;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center gap-4 px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search incidents..."
              className="pl-8 h-8 text-sm bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-orange-500/50"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded font-mono">
              /
            </kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
                onClick={() => setShowNotif((v) => !v)}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              {showNotif && (
                <NotificationsPanel onClose={() => setShowNotif(false)} />
              )}
            </div>
            <Button
              onClick={() => setSosMode(true)}
              size="sm"
              className="h-8 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-3 gap-1.5 shadow-lg shadow-red-900/40"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              SOS Mode
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1400px] h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />

      {sosMode && (
        <div className="fixed inset-0 z-50 bg-red-950/97 flex flex-col items-center justify-center px-6 overflow-y-auto py-10">
          <div className="animate-bounce mb-4">
            <AlertTriangle className="w-16 h-16 text-red-400" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 text-center">
            EMERGENCY SOS MODE
          </h1>
          <p className="text-red-300 text-sm mb-8 text-center">
            All standard protocols overridden — emergency response activated
          </p>

          <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* NDRF */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-red-300/70 mb-1">NDRF Helpline</p>
              <p className="text-3xl font-black text-white tabular-nums mb-1">1078</p>
              <p className="text-xs text-white/50">National Disaster Response Force</p>
              <p className="text-[10px] text-white/30 mt-1">24 × 7 Emergency</p>
            </div>

            {/* NDMA */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-red-300/70 mb-1">NDMA Helpline</p>
              <p className="text-3xl font-black text-white tabular-nums mb-1">112</p>
              <p className="text-xs text-white/50">National Disaster Mgmt. Authority</p>
              <p className="text-[10px] text-white/30 mt-1">National Emergency Number</p>
            </div>

            {/* Team 9/11 */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-orange-300/70 mb-1">Team 9/11 — Kavach SOS</p>
              <p className="text-2xl font-black text-orange-400 mb-1">❤️ ❤️ ✈️</p>
              <p className="text-xs text-white/60 mb-2">Platform Operations Team</p>
              <div className="space-y-0.5 text-[10px] text-white/40 font-mono">
                <p>kavachsos@team911.in</p>
                <p>+91 98765 43210</p>
                <p>New Delhi, India</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-2xl bg-white/3 border border-white/8 rounded-xl p-4 mb-8">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 text-center">Emergency Protocol</p>
            <div className="grid grid-cols-3 gap-3 text-center text-xs text-white/60">
              <div>
                <p className="text-white font-semibold mb-0.5">Step 1</p>
                <p>Call 112 or 1078 immediately</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-0.5">Step 2</p>
                <p>Log incident in the system</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-0.5">Step 3</p>
                <p>Deploy nearest rescue team</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setSosMode(false)}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <X className="w-4 h-4" />
            Dismiss Emergency Mode
          </Button>
          <p className="text-[10px] text-white/20 mt-4 font-mono">
            Kavach SOS · National Emergency Operations · built with love by Team 9/11 ❤️ ❤️ ✈️
          </p>
        </div>
      )}
    </div>
  );
}
