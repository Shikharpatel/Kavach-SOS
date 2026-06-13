import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListShelters, useRecommendShelters, useListIncidents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Home, Users, MapPin, Zap, Navigation, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  available: "text-green-400 bg-green-500/10 border-green-500/25",
  full: "text-red-400 bg-red-500/10 border-red-500/25",
  closed: "text-gray-400 bg-gray-500/10 border-gray-500/25",
};

const STATUS_MAP_COLOR: Record<string, string> = {
  available: "#22c55e",
  full: "#ef4444",
  closed: "#6b7280",
};

function OccupancyBar({ current, capacity }: { current: number; capacity: number }) {
  const pct = Math.min(100, Math.round((current / capacity) * 100));
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{current.toLocaleString()} / {capacity.toLocaleString()}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Shelters() {
  const [incidentId, setIncidentId] = useState("");
  const [lat, setLat] = useState("19.076");
  const [lng, setLng] = useState("72.877");
  const [population, setPopulation] = useState("5000");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [bfsError, setBfsError] = useState("");

  const { data: shelters, isLoading } = useListShelters();
  const { data: incidents } = useListIncidents();
  const { mutateAsync: recommend, isPending } = useRecommendShelters();

  const handlePickIncident = (id: string) => {
    setIncidentId(id);
    setBfsError("");
    const inc = incidents?.find((i: any) => String(i.id) === id);
    if (inc) {
      setLat(String(inc.latitude));
      setLng(String(inc.longitude));
      setPopulation(String(inc.affectedPopulation ?? 5000));
    }
  };

  const handleRecommend = async () => {
    if (!incidentId) { setBfsError("Please select an incident first."); return; }
    setBfsError("");
    try {
      const res = await recommend({
        data: {
          incidentId: parseInt(incidentId),
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          requiredCapacity: parseInt(population) || 1000,
        },
      });
      setRecommendations(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setBfsError(e?.message ?? "BFS search failed. Please try again.");
    }
  };

  const totalCapacity = shelters?.reduce((s: number, sh: any) => s + sh.capacity, 0) ?? 0;
  const totalOccupied = shelters?.reduce((s: number, sh: any) => s + sh.currentOccupancy, 0) ?? 0;
  const available = shelters?.filter((s: any) => s.status === "available").length ?? 0;
  const full = shelters?.filter((s: any) => s.status === "full").length ?? 0;

  return (
    <MainLayout>
      <div className="flex-1 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shelter Network</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            BFS-powered proximity routing to find nearest available shelters
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Shelters", value: shelters?.length ?? 0, icon: Home, color: "text-blue-400" },
            { label: "Available", value: available, icon: CheckCircle, color: "text-green-400" },
            { label: "At Capacity", value: full, icon: Zap, color: "text-red-400" },
            { label: "People Sheltered", value: totalOccupied.toLocaleString(), icon: Users, color: "text-amber-400" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="bg-card/40 border-border/50">
                <CardContent className="p-4">
                  <Icon className={cn("w-4 h-4 mb-2", s.color)} />
                  <div className="text-xl font-bold tabular-nums">{s.value}</div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* BFS Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  BFS Shelter Finder
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Select an incident — BFS graph traversal will find the nearest available shelters automatically.
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Incident *</Label>
                  <Select value={incidentId} onValueChange={handlePickIncident}>
                    <SelectTrigger className="h-9 text-sm bg-muted/20 border-border/50">
                      <SelectValue placeholder="Select incident to find shelters for..." />
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Latitude</Label>
                    <Input value={lat} onChange={(e) => setLat(e.target.value)} className="h-8 text-sm bg-muted/20 border-border/50 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Longitude</Label>
                    <Input value={lng} onChange={(e) => setLng(e.target.value)} className="h-8 text-sm bg-muted/20 border-border/50 font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Required Capacity</Label>
                  <Input
                    type="number"
                    value={population}
                    onChange={(e) => setPopulation(e.target.value)}
                    placeholder="Number of people"
                    className="h-8 text-sm bg-muted/20 border-border/50"
                  />
                </div>

                {bfsError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {bfsError}
                  </p>
                )}

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2"
                  onClick={handleRecommend}
                  disabled={isPending || !incidentId}
                >
                  <Navigation className="w-4 h-4" />
                  {isPending ? "Searching with BFS..." : "Find Nearest Shelters"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center font-mono">O(V+E) BFS graph traversal</p>
              </CardContent>
            </Card>

            {recommendations.length > 0 && (
              <Card className="bg-card/40 border-green-500/20">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-green-400">
                    BFS Results — {recommendations.length} shelter{recommendations.length !== 1 ? "s" : ""} found
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  {recommendations.map((rec: any, i: number) => {
                    const s = rec.shelter ?? rec;
                    return (
                      <div key={i} className="p-3 rounded-lg bg-muted/10 border border-border/30">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-xs font-semibold leading-tight">{s.name}</p>
                          {rec.distanceKm != null && (
                            <span className="text-[10px] font-mono text-green-400 shrink-0 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">
                              {rec.distanceKm.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2">📍 {s.address}</p>
                        <OccupancyBar current={s.currentOccupancy ?? 0} capacity={s.capacity ?? 1} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map + list */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="bg-card/40 border-border/50 overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Shelter Map
                  <span className="text-[10px] text-muted-foreground font-normal ml-auto">🟢 Available  🔴 Full</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[280px]">
                  <MapContainer center={[22.5, 80.5]} zoom={5} style={{ height: "100%", width: "100%", background: "#0d1117" }} zoomControl>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                      subdomains="abcd" maxZoom={19}
                    />
                    {shelters?.map((shelter: any) => (
                      <CircleMarker
                        key={shelter.id}
                        center={[shelter.latitude, shelter.longitude]}
                        radius={10}
                        fillColor={STATUS_MAP_COLOR[shelter.status] ?? "#6b7280"}
                        color={STATUS_MAP_COLOR[shelter.status] ?? "#6b7280"}
                        weight={1.5} fillOpacity={0.8}
                      >
                        <Popup>
                          <div className="text-xs">
                            <strong>{shelter.name}</strong><br />
                            {shelter.address}<br />
                            {shelter.currentOccupancy}/{shelter.capacity} occupied<br />
                            <strong style={{ color: STATUS_MAP_COLOR[shelter.status] }}>{shelter.status}</strong>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold">All Shelters</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {isLoading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full bg-muted/20" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {shelters?.map((shelter: any) => (
                      <div key={shelter.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/10 border border-border/30 hover:border-border/60 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold truncate">{shelter.name}</p>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium capitalize shrink-0", STATUS_STYLE[shelter.status] ?? "text-muted-foreground bg-muted/10 border-border/30")}>
                              {shelter.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mb-1.5">📍 {shelter.address}</p>
                          <OccupancyBar current={shelter.currentOccupancy} capacity={shelter.capacity} />
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground mb-1">Facilities</p>
                          <div className="flex flex-wrap gap-1 justify-end max-w-32">
                            {shelter.facilities?.slice(0, 3).map((f: string) => (
                              <span key={f} className="text-[9px] px-1 py-0.5 bg-muted/20 rounded border border-border/30 text-muted-foreground">{f}</span>
                            ))}
                            {shelter.facilities?.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{shelter.facilities.length - 3}</span>
                            )}
                          </div>
                        </div>
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
