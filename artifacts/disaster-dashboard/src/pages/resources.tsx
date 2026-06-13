import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListResources, useGetResourceUtilization, useAllocateResources, useListIncidents } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Droplets, HeartPulse, Activity, Navigation, Crosshair, Target, CheckCircle2, AlertTriangle, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const CAT_ICON: Record<string, React.ElementType> = {
  food: Package,
  water: Droplets,
  medical: HeartPulse,
  rescue_team: Activity,
  boat: Navigation,
  ambulance: Crosshair,
  vehicle: Truck,
};

export default function Resources() {
  const queryClient = useQueryClient();
  const { data: resources, isLoading: loadingResources } = useListResources();
  const { data: utilization, isLoading: loadingUtilization } = useGetResourceUtilization();
  const { data: incidents } = useListIncidents();
  const { mutateAsync: allocate, isPending } = useAllocateResources();

  const [incidentId, setIncidentId] = useState("");
  const [severity, setSeverity] = useState(5);
  const [population, setPopulation] = useState(10000);
  const [allocationResult, setAllocationResult] = useState<any>(null);
  const [allocationError, setAllocationError] = useState("");

  const handleAllocate = async () => {
    if (!incidentId) { setAllocationError("Please select an incident."); return; }
    setAllocationError("");
    setAllocationResult(null);
    try {
      const result = await allocate({
        data: {
          incidentId: parseInt(incidentId),
          severity,
          affectedPopulation: population,
        },
      });
      setAllocationResult(result);
      // Refresh inventory to reflect consumed resources
      queryClient.invalidateQueries({ queryKey: ["/api/resources/stats/utilization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    } catch (e: any) {
      setAllocationError(e?.message ?? "Allocation failed.");
    }
  };

  const handlePickIncident = (id: string) => {
    setIncidentId(id);
    setAllocationResult(null);
    const inc = incidents?.find((i: any) => String(i.id) === id);
    if (inc) {
      setSeverity(inc.severity ?? 5);
      setPopulation(inc.affectedPopulation ?? 10000);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-5 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live inventory and Greedy algorithmic allocation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Utilization */}
          <Card className="lg:col-span-2 bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">Global Inventory Utilization</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {loadingUtilization ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-muted/20" />)
              ) : (
                utilization?.map((u: any) => {
                  const Icon = CAT_ICON[u.category] ?? Package;
                  const pct = u.utilizationPct ?? 0;
                  return (
                    <div key={u.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", pct > 80 ? "text-red-400" : pct > 50 ? "text-amber-400" : "text-green-400")} />
                          <span className="font-medium capitalize">{u.category.replace(/_/g, " ")}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                          <span>{u.available?.toLocaleString()} / {u.total?.toLocaleString()} available</span>
                          <span className={cn("font-bold tabular-nums", pct > 80 ? "text-red-400" : pct > 50 ? "text-amber-400" : "text-green-400")}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-green-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Allocation engine */}
          <Card className="bg-card/40 backdrop-blur-sm border-blue-500/20">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-400">
                <Target className="w-4 h-4" />
                Greedy Allocation Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <p className="text-xs text-muted-foreground">
                Select an incident and run the Greedy Algorithm to optimally distribute resources by priority.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Target Incident *</Label>
                <Select value={incidentId} onValueChange={handlePickIncident}>
                  <SelectTrigger className="h-8 text-sm bg-muted/20 border-border/50">
                    <SelectValue placeholder="Select incident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {incidents?.map((inc: any) => (
                      <SelectItem key={inc.id} value={String(inc.id)}>
                        #{inc.id} — {inc.title.slice(0, 30)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Severity: <span className="font-bold text-foreground">{severity}/10</span>
                </Label>
                <Slider min={1} max={10} step={1} value={[severity]} onValueChange={([v]) => setSeverity(v)} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Affected Population: <span className="font-bold text-foreground">{population.toLocaleString()}</span>
                </Label>
                <Slider min={1000} max={500000} step={1000} value={[population]} onValueChange={([v]) => setPopulation(v)} />
              </div>

              <div className="bg-muted/10 rounded-md p-2.5 font-mono text-[11px] text-muted-foreground space-y-0.5">
                <div className="text-blue-400">{'>'} GREEDY_ALGO_READY</div>
                <div>{'>'} O(R log R) complexity</div>
                <div className="animate-pulse">_</div>
              </div>

              {allocationError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {allocationError}
                </p>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2"
                onClick={handleAllocate}
                disabled={!incidentId || isPending}
              >
                <Target className="w-4 h-4" />
                {isPending ? "Running Algorithm..." : "Run Allocation"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Allocation Result — no efficiency score */}
        {allocationResult && (
          <Card className="bg-card/40 border-green-500/20 shadow-lg shadow-green-900/5">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Resources Allocated — Inventory Updated
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allocationResult.allocations?.map((a: any) => {
                  const Icon = CAT_ICON[a.category] ?? Package;
                  return (
                    <div key={a.resourceId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/30">
                      <Icon className="w-4 h-4 text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{a.resourceName}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{a.category.replace(/_/g, " ")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-400 tabular-nums">{a.allocated?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{a.unit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {allocationResult.shortages?.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Resource Shortages Detected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allocationResult.shortages.map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 capitalize">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resource inventory */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Resource Inventory</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loadingResources ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 bg-muted/20" />)}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resources?.map((r: any) => {
                  const Icon = CAT_ICON[r.category] ?? Package;
                  const pct = r.totalQuantity > 0 ? Math.round(((r.totalQuantity - r.availableQuantity) / r.totalQuantity) * 100) : 0;
                  return (
                    <div key={r.id} className="p-3 rounded-lg bg-muted/10 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="text-xs font-semibold truncate flex-1">{r.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border capitalize bg-muted/20 border-border/30 text-muted-foreground shrink-0">
                          {r.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{r.availableQuantity?.toLocaleString()} / {r.totalQuantity?.toLocaleString()} {r.unit}</span>
                        <span className={cn("font-bold", pct > 80 ? "text-red-400" : pct > 50 ? "text-amber-400" : "text-green-400")}>{pct}% used</span>
                      </div>
                      <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
