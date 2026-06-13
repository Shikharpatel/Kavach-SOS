import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { usePlanRescueRoute, useListRoutes, useListRescueTeams, useListIncidents, useUpdateRescueTeam } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import { Navigation, Route, Clock, Gauge, Users, MapPin, ChevronRight, Layers, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  deployed: "text-orange-400 bg-orange-500/10 border-orange-500/25",
  available: "text-green-400 bg-green-500/10 border-green-500/25",
  standby: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  resting: "text-purple-400 bg-purple-500/10 border-purple-500/25",
};

const STATUS_NEXT: Record<string, string> = {
  available: "deployed",
  deployed: "standby",
  standby: "resting",
  resting: "available",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  deployed: "Deployed",
  standby: "Standby",
  resting: "Resting",
};

const TYPE_COLORS: Record<string, string> = {
  flood_rescue: "text-blue-400",
  search_rescue: "text-amber-400",
  medical: "text-red-400",
  firefighting: "text-orange-400",
  logistics: "text-purple-400",
};

export default function RescueRoutes() {
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedIncident, setSelectedIncident] = useState("");
  const [routeResult, setRouteResult] = useState<any>(null);
  const [updatingTeam, setUpdatingTeam] = useState<number | null>(null);

  const { data: teams, isLoading: loadingTeams } = useListRescueTeams();
  const { data: incidents } = useListIncidents();
  const { data: routes, isLoading: loadingRoutes } = useListRoutes();
  const { mutateAsync: planRoute, isPending } = usePlanRescueRoute();
  const { mutateAsync: updateTeam } = useUpdateRescueTeam();

  const handlePlanRoute = async () => {
    if (!selectedTeam || !selectedIncident) return;
    try {
      const res = await planRoute({
        data: {
          teamId: parseInt(selectedTeam),
          incidentId: parseInt(selectedIncident),
        },
      });
      setRouteResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (team: any) => {
    const nextStatus = STATUS_NEXT[team.status] ?? "available";
    setUpdatingTeam(team.id);
    try {
      await updateTeam({ id: team.id, data: { status: nextStatus as any } });
      queryClient.invalidateQueries({ queryKey: ["/api/rescue-teams"] });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingTeam(null);
    }
  };

  const team = teams?.find((t: any) => String(t.id) === selectedTeam);
  const incident = incidents?.find((i: any) => String(i.id) === selectedIncident);

  const polylineCoords: [number, number][] = routeResult?.waypoints
    ? routeResult.waypoints.map((w: any) => [w.latitude, w.longitude] as [number, number])
    : [];

  return (
    <MainLayout>
      <div className="flex-1 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rescue Route Planning</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dijkstra's algorithm — shortest path from rescue team to incident
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Control panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-400" />
                  Plan Rescue Route
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Rescue Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="h-9 text-sm bg-muted/20 border-border/50">
                      <SelectValue placeholder="Select rescue team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          <span className="flex items-center gap-2">
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 inline-block",
                              t.status === "available" ? "bg-green-400" :
                              t.status === "deployed" ? "bg-orange-400" :
                              t.status === "resting" ? "bg-purple-400" : "bg-blue-400")} />
                            {t.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Target Incident</Label>
                  <Select value={selectedIncident} onValueChange={setSelectedIncident}>
                    <SelectTrigger className="h-9 text-sm bg-muted/20 border-border/50">
                      <SelectValue placeholder="Select incident..." />
                    </SelectTrigger>
                    <SelectContent>
                      {incidents?.map((inc: any) => (
                        <SelectItem key={inc.id} value={String(inc.id)}>
                          #{inc.id} — {inc.title.slice(0, 35)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(team || incident) && (
                  <div className="bg-muted/10 rounded-lg p-3 space-y-2 text-xs">
                    {team && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium truncate">{team.name}</span>
                        <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded border capitalize shrink-0", STATUS_STYLE[team.status] ?? "")}>
                          {team.status}
                        </span>
                      </div>
                    )}
                    {incident && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-muted-foreground">To:</span>
                        <span className="font-medium truncate">{incident.title.slice(0, 30)}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2"
                  onClick={handlePlanRoute}
                  disabled={!selectedTeam || !selectedIncident || isPending}
                >
                  <Navigation className="w-4 h-4" />
                  {isPending ? "Computing Route..." : "Plan Dijkstra Route"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center font-mono">
                  O((V+E) log V) • Haversine distance metric
                </p>
              </CardContent>
            </Card>

            {routeResult && (
              <Card className="bg-card/40 border-blue-500/20 shadow-lg shadow-blue-900/10">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Optimal Route Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/10 rounded-lg p-3 text-center">
                      <Gauge className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold font-mono tabular-nums">
                        {routeResult.totalDistanceKm?.toFixed(1) ?? "—"}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">km</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Distance</p>
                    </div>
                    <div className="bg-muted/10 rounded-lg p-3 text-center">
                      <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-bold font-mono tabular-nums">
                        {routeResult.estimatedTimeMinutes ?? "—"}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">min</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ETA</p>
                    </div>
                  </div>
                  {routeResult.waypoints?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">
                        Waypoints ({routeResult.waypoints.length})
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {routeResult.waypoints.map((wp: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[9px] font-mono text-blue-400 shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-muted-foreground truncate flex-1">
                              {wp.name ?? `${wp.latitude?.toFixed(3)}, ${wp.longitude?.toFixed(3)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {routeResult.notes && (
                    <p className="text-[10px] text-muted-foreground bg-muted/10 rounded p-2 italic">{routeResult.notes}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map + Teams */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="bg-card/40 border-border/50 overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Live Operations Map
                  <span className="text-[10px] text-muted-foreground font-normal ml-auto">🔴 Incidents  🟢 Available  🟠 Deployed  🔵 Standby</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px]">
                  <MapContainer center={[22.5, 80.5]} zoom={5} style={{ height: "100%", width: "100%", background: "#0d1117" }}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                      subdomains="abcd"
                      maxZoom={19}
                    />
                    {incidents?.map((inc: any) => (
                      <CircleMarker key={`inc-${inc.id}`} center={[inc.latitude, inc.longitude]} radius={8} fillColor="#ef4444" color="#dc2626" weight={1.5} fillOpacity={0.8}>
                        <Popup><div className="text-xs"><strong>🔴 {inc.title}</strong><br />Severity: {inc.severity}/10</div></Popup>
                      </CircleMarker>
                    ))}
                    {teams?.map((t: any) => (
                      <CircleMarker
                        key={`team-${t.id}`}
                        center={[t.latitude, t.longitude]}
                        radius={6}
                        fillColor={t.status === "available" ? "#22c55e" : t.status === "deployed" ? "#f97316" : t.status === "resting" ? "#a855f7" : "#3b82f6"}
                        color="#fff" weight={1} fillOpacity={0.9}
                      >
                        <Popup><div className="text-xs"><strong>👥 {t.name}</strong><br />Status: {t.status}</div></Popup>
                      </CircleMarker>
                    ))}
                    {polylineCoords.length > 1 && (
                      <Polyline positions={polylineCoords} color="#3b82f6" weight={3} opacity={0.85} dashArray="8 4" />
                    )}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Rescue teams with status toggle */}
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Rescue Teams
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">Click status badge to cycle: Available → Deployed → Standby → Resting</p>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {loadingTeams ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 bg-muted/20" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {teams?.map((t: any) => (
                      <div
                        key={t.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer",
                          selectedTeam === String(t.id)
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-muted/10 border-border/30 hover:border-border/60"
                        )}
                        onClick={() => setSelectedTeam(String(t.id))}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold truncate">{t.name}</p>
                          </div>
                          <p className={cn("text-[10px] capitalize", TYPE_COLORS[t.type] ?? "text-muted-foreground")}>
                            {t.type.replace(/_/g, " ")} • {t.size} members
                          </p>
                        </div>
                        {t.assignedIncidentId && (
                          <span className="text-[10px] text-muted-foreground shrink-0">→ Inc #{t.assignedIncidentId}</span>
                        )}
                        {/* Clickable status badge */}
                        <button
                          className={cn(
                            "text-[10px] font-semibold px-2 py-1 rounded border capitalize shrink-0 transition-all hover:opacity-80 flex items-center gap-1",
                            STATUS_STYLE[t.status] ?? "text-muted-foreground bg-muted/10 border-border/30"
                          )}
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(t); }}
                          disabled={updatingTeam === t.id}
                          title={`Click to change to: ${STATUS_LABEL[STATUS_NEXT[t.status]] ?? "available"}`}
                        >
                          {updatingTeam === t.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : null}
                          {STATUS_LABEL[t.status] ?? t.status}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
