import { MainLayout } from "@/components/layout/MainLayout";
import {
  useGetIncidentSummary,
  useGetIncidentTrends,
  useGetRegionImpact,
  useListIncidents,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Home, Package, TrendingUp, TrendingDown, Minus, ShieldAlert, Flame, Droplets, Waves, Wind, Mountain } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  active: "#f97316",
  monitoring: "#eab308",
  resolved: "#22c55e",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  active: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  monitoring: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border border-green-500/30",
};

const REGION_BAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#6366f1",
];

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  badge,
  badgeColor = "text-muted-foreground",
  highlight,
}: {
  title: string;
  value?: string | number | null;
  icon: React.ElementType;
  loading?: boolean;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "bg-card/60 backdrop-blur-sm border-border/50 hover:border-border transition-colors",
        highlight && "border-red-500/30 bg-red-950/10"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
          {badge && (
            <span className={cn("text-[10px] font-medium", badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-20 bg-muted/30 mb-1" />
        ) : (
          <div className={cn("text-2xl font-bold font-mono tabular-nums", highlight ? "text-red-400" : "text-foreground")}>
            {value ?? "—"}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{title}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetIncidentSummary();
  const { data: trends, isLoading: loadingTrends } = useGetIncidentTrends();
  const { data: regions, isLoading: loadingRegions } = useGetRegionImpact();
  const { data: incidents, isLoading: loadingIncidents } = useListIncidents();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sortedIncidents = incidents
    ? [...incidents].sort((a, b) => b.severity - a.severity).slice(0, 8)
    : [];

  return (
    <MainLayout>
      <div className="flex-1 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            title="Total Incidents"
            value={summary?.totalIncidents}
            icon={Activity}
            loading={loadingSummary}
            badge={`+${summary?.criticalIncidents ?? 0} today`}
            badgeColor="text-blue-400"
          />
          <StatCard
            title="Active Operations"
            value={summary?.activeRescueOps}
            icon={Activity}
            loading={loadingSummary}
            badge="→ live"
            badgeColor="text-green-400"
          />
          <StatCard
            title="Population Affected"
            value={
              summary?.populationAffected
                ? summary.populationAffected.toLocaleString()
                : null
            }
            icon={Users}
            loading={loadingSummary}
            badge="+12% 24h"
            badgeColor="text-amber-400"
          />
          <StatCard
            title="Resource Utilization"
            value={
              summary?.resourceUtilizationPct
                ? `${summary.resourceUtilizationPct}%`
                : null
            }
            icon={Package}
            loading={loadingSummary}
            badge="→ optimal"
            badgeColor="text-green-400"
          />
          <StatCard
            title="Shelter Occupancy"
            value={
              summary?.shelterOccupancy
                ? `${summary.shelterOccupancy}%`
                : null
            }
            icon={Home}
            loading={loadingSummary}
            badge="↑ high load"
            badgeColor="text-orange-400"
          />
        </div>

        {/* Risk Assessment */}
        <Card className="bg-card/40 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              Risk Assessment Matrix
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">Severity × Population scoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {incidents?.slice(0, 5).map((inc: any) => {
                const riskScore = Math.round((inc.severity / 10) * 0.6 * 100 + (Math.min(inc.affectedPopulation, 500000) / 500000) * 0.4 * 100);
                const riskLevel = riskScore >= 75 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : riskScore >= 25 ? "MEDIUM" : "LOW";
                const riskColor = riskScore >= 75 ? "text-red-400 bg-red-500/10 border-red-500/25" :
                  riskScore >= 50 ? "text-orange-400 bg-orange-500/10 border-orange-500/25" :
                  riskScore >= 25 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/25" :
                  "text-green-400 bg-green-500/10 border-green-500/25";
                const barColor = riskScore >= 75 ? "bg-red-500" : riskScore >= 50 ? "bg-orange-500" : riskScore >= 25 ? "bg-yellow-500" : "bg-green-500";
                const CategoryIcon = inc.category === "fire" ? Flame : inc.category === "flood" || inc.category === "cyclone" ? Waves : inc.category === "earthquake" ? Mountain : ShieldAlert;
                return (
                  <div key={inc.id} className="p-3 rounded-lg bg-muted/10 border border-border/30 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <CategoryIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${riskColor}`}>{riskLevel}</span>
                    </div>
                    <p className="text-[11px] font-semibold leading-tight line-clamp-2">{inc.title}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Risk Score</span>
                        <span className="font-bold tabular-nums">{riskScore}/100</span>
                      </div>
                      <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${riskScore}%` }} />
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {inc.affectedPopulation?.toLocaleString()} at risk
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Map + Incident Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Map */}
          <Card className="lg:col-span-3 bg-card/40 backdrop-blur-sm border-border/50 overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-foreground">
                Live Operational Map
              </CardTitle>
              <p className="text-xs text-muted-foreground -mt-1">
                Active incidents sized by population impact
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[380px] w-full">
                <MapContainer
                  center={[22.5, 80.5]}
                  zoom={5}
                  style={{ height: "100%", width: "100%", background: "#0d1117" }}
                  zoomControl={true}
                  attributionControl={true}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={19}
                  />
                  {regions?.map((region: any, idx: number) => (
                    <CircleMarker
                      key={idx}
                      center={[region.latitude, region.longitude]}
                      radius={Math.min(6 + region.totalAffected / 8000, 32)}
                      fillColor={
                        region.avgSeverity >= 8
                          ? "#ef4444"
                          : region.avgSeverity >= 6
                          ? "#f97316"
                          : "#eab308"
                      }
                      color={
                        region.avgSeverity >= 8
                          ? "#dc2626"
                          : region.avgSeverity >= 6
                          ? "#ea580c"
                          : "#ca8a04"
                      }
                      weight={1.5}
                      fillOpacity={0.7}
                    >
                      <Popup>
                        <div className="text-xs">
                          <strong>{region.region}</strong>
                          <br />
                          Affected: {region.totalAffected?.toLocaleString()}
                          <br />
                          Severity: {region.avgSeverity}/10
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Live Incident Feed */}
          <Card className="lg:col-span-2 bg-card/40 backdrop-blur-sm border-border/50 flex flex-col">
            <CardHeader className="pb-2 pt-4 px-5 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Live Incident Feed
                </CardTitle>
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 flex-1 overflow-y-auto min-h-0 max-h-[380px]">
              {loadingIncidents ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-muted/20 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sortedIncidents.map((incident: any) => (
                    <div
                      key={incident.id}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{
                          backgroundColor:
                            SEVERITY_COLORS[incident.status] ?? "#6b7280",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate leading-snug">
                          {incident.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground truncate">
                            📍 {incident.region}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            👥 {incident.affectedPopulation?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            🕐{" "}
                            {formatDistanceToNow(new Date(incident.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize shrink-0",
                          SEVERITY_BADGE[incident.status] ??
                            "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {incident.status === "monitoring" ? "Moderate" : incident.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">Disaster Trends (7 days)</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {loadingTrends ? (
                <Skeleton className="h-[200px] w-full bg-muted/20" />
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#trendGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">Most Affected Regions</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {loadingRegions ? (
                <Skeleton className="h-[200px] w-full bg-muted/20" />
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regions?.slice(0, 7)}
                      layout="vertical"
                      margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="region"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                        formatter={(v: any) => [v.toLocaleString(), "Affected"]}
                      />
                      <Bar dataKey="totalAffected" name="Affected" radius={[0, 3, 3, 0]}>
                        {regions?.slice(0, 7).map((_: any, i: number) => (
                          <Cell key={i} fill={REGION_BAR_COLORS[i % REGION_BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
