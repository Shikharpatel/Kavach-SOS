import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  useListRescueTeams,
  useCreateRescueTeam,
  useListShelters,
  useCreateShelter,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Home, Plus, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const TEAM_TYPES = [
  { value: "medical", label: "Medical" },
  { value: "firefighting", label: "Firefighting" },
  { value: "flood_rescue", label: "Flood Rescue" },
  { value: "search_rescue", label: "Search & Rescue" },
  { value: "logistics", label: "Logistics" },
];

const STATUS_STYLE: Record<string, string> = {
  available: "text-green-400 bg-green-500/10 border-green-500/25",
  deployed: "text-orange-400 bg-orange-500/10 border-orange-500/25",
  standby: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  resting: "text-purple-400 bg-purple-500/10 border-purple-500/25",
};

const SHELTER_STATUS_STYLE: Record<string, string> = {
  available: "text-green-400 bg-green-500/10 border-green-500/25",
  full: "text-red-400 bg-red-500/10 border-red-500/25",
  closed: "text-gray-400 bg-gray-500/10 border-gray-500/25",
};

const emptyTeam = {
  name: "",
  type: "search_rescue",
  size: 10,
  latitude: 22.5,
  longitude: 80.5,
  equipment: "",
};

const emptyShelter = {
  name: "",
  latitude: 22.5,
  longitude: 80.5,
  capacity: 500,
  address: "",
  facilities: "",
};

function SuccessMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-2">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </div>
  );
}

export default function Admin() {
  const queryClient = useQueryClient();

  const { data: teams, isLoading: loadingTeams } = useListRescueTeams();
  const { data: shelters, isLoading: loadingShelters } = useListShelters();
  const { mutateAsync: createTeam, isPending: creatingTeam } = useCreateRescueTeam();
  const { mutateAsync: createShelter, isPending: creatingShelter } = useCreateShelter();

  const [teamForm, setTeamForm] = useState({ ...emptyTeam });
  const [shelterForm, setShelterForm] = useState({ ...emptyShelter });
  const [teamSuccess, setTeamSuccess] = useState("");
  const [teamError, setTeamError] = useState("");
  const [shelterSuccess, setShelterSuccess] = useState("");
  const [shelterError, setShelterError] = useState("");

  const setTeam = (k: keyof typeof emptyTeam, v: any) =>
    setTeamForm((f) => ({ ...f, [k]: v }));
  const setShelter = (k: keyof typeof emptyShelter, v: any) =>
    setShelterForm((f) => ({ ...f, [k]: v }));

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) { setTeamError("Team name is required."); return; }
    setTeamError(""); setTeamSuccess("");
    try {
      await createTeam({
        data: {
          name: teamForm.name.trim(),
          type: teamForm.type as any,
          size: Number(teamForm.size),
          latitude: Number(teamForm.latitude),
          longitude: Number(teamForm.longitude),
          equipment: teamForm.equipment
            ? teamForm.equipment.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rescue-teams"] });
      setTeamSuccess(`"${teamForm.name}" created — now visible in Rescue Routing!`);
      setTeamForm({ ...emptyTeam });
    } catch (e: any) {
      setTeamError(e?.message ?? "Failed to create team.");
    }
  };

  const handleCreateShelter = async () => {
    if (!shelterForm.name.trim()) { setShelterError("Shelter name is required."); return; }
    setShelterError(""); setShelterSuccess("");
    try {
      await createShelter({
        data: {
          name: shelterForm.name.trim(),
          latitude: Number(shelterForm.latitude),
          longitude: Number(shelterForm.longitude),
          capacity: Number(shelterForm.capacity),
          currentOccupancy: 0,
          address: shelterForm.address || undefined,
          facilities: shelterForm.facilities
            ? shelterForm.facilities.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shelters"] });
      setShelterSuccess(`"${shelterForm.name}" created — now visible in the Shelter Network!`);
      setShelterForm({ ...emptyShelter });
    } catch (e: any) {
      setShelterError(e?.message ?? "Failed to create shelter.");
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-5 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create and manage rescue teams and shelters — changes reflect live across all modules
            </p>
          </div>
        </div>

        <Tabs defaultValue="teams">
          <TabsList className="bg-muted/20 border border-border/50 h-9">
            <TabsTrigger
              value="teams"
              className="gap-2 text-xs data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-400"
            >
              <Users className="w-3.5 h-3.5" />
              Rescue Teams ({teams?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="shelters"
              className="gap-2 text-xs data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-400"
            >
              <Home className="w-3.5 h-3.5" />
              Shelters ({shelters?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* ===== RESCUE TEAMS ===== */}
          <TabsContent value="teams" className="mt-4 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <Card className="lg:col-span-2 bg-card/40 border-border/50">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-400" />
                    Add New Rescue Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Team Name *</Label>
                    <Input
                      value={teamForm.name}
                      onChange={(e) => setTeam("name", e.target.value)}
                      placeholder="e.g. Kerala Flood Response Unit"
                      className="h-8 text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Type *</Label>
                    <Select value={teamForm.type} onValueChange={(v) => setTeam("type", v)}>
                      <SelectTrigger className="h-8 text-sm bg-muted/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Team Size (members)</Label>
                    <Input
                      type="number" min={1}
                      value={teamForm.size}
                      onChange={(e) => setTeam("size", e.target.value)}
                      className="h-8 text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Latitude</Label>
                      <Input
                        type="number"
                        value={teamForm.latitude}
                        onChange={(e) => setTeam("latitude", e.target.value)}
                        className="h-8 text-sm bg-muted/20 border-border/50 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Longitude</Label>
                      <Input
                        type="number"
                        value={teamForm.longitude}
                        onChange={(e) => setTeam("longitude", e.target.value)}
                        className="h-8 text-sm bg-muted/20 border-border/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Equipment (comma-separated)</Label>
                    <Input
                      value={teamForm.equipment}
                      onChange={(e) => setTeam("equipment", e.target.value)}
                      placeholder="boats, radios, first-aid kits"
                      className="h-8 text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  {teamError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {teamError}
                    </p>
                  )}
                  {teamSuccess && <SuccessMsg msg={teamSuccess} />}

                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold gap-2"
                    onClick={handleCreateTeam}
                    disabled={!teamForm.name.trim() || creatingTeam}
                  >
                    <Plus className="w-4 h-4" />
                    {creatingTeam ? "Creating..." : "Create Rescue Team"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 bg-card/40 border-border/50">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold">All Rescue Teams</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {loadingTeams ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 bg-muted/20" />)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {teams?.map((t: any) => (
                        <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/30">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                              {t.type.replace(/_/g, " ")} · {t.size} members
                            </p>
                            {t.equipment?.length > 0 && (
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                                🔧 {t.equipment.join(", ")}
                              </p>
                            )}
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-1 rounded border capitalize shrink-0",
                            STATUS_STYLE[t.status] ?? "text-muted-foreground bg-muted/10 border-border/30"
                          )}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== SHELTERS ===== */}
          <TabsContent value="shelters" className="mt-4 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <Card className="lg:col-span-2 bg-card/40 border-border/50">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-400" />
                    Add New Shelter
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Shelter Name *</Label>
                    <Input
                      value={shelterForm.name}
                      onChange={(e) => setShelter("name", e.target.value)}
                      placeholder="e.g. Bhopal Central Relief Camp"
                      className="h-8 text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Address / Landmark</Label>
                    <Input
                      value={shelterForm.address}
                      onChange={(e) => setShelter("address", e.target.value)}
                      placeholder="Full address or landmark"
                      className="h-8 text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Capacity (people)</Label>
                    <Input
                      type="number" min={1}
                      value={shelterForm.capacity}
                      onChange={(e) => setShelter("capacity", e.target.value)}
                      className="h-8 text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Latitude</Label>
                      <Input
                        type="number"
                        value={shelterForm.latitude}
                        onChange={(e) => setShelter("latitude", e.target.value)}
                        className="h-8 text-sm bg-muted/20 border-border/50 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Longitude</Label>
                      <Input
                        type="number"
                        value={shelterForm.longitude}
                        onChange={(e) => setShelter("longitude", e.target.value)}
                        className="h-8 text-sm bg-muted/20 border-border/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Facilities (comma-separated)</Label>
                    <Input
                      value={shelterForm.facilities}
                      onChange={(e) => setShelter("facilities", e.target.value)}
                      placeholder="medical unit, kitchen, toilets"
                      className="h-8 text-sm bg-muted/20 border-border/50"
                    />
                  </div>

                  {shelterError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {shelterError}
                    </p>
                  )}
                  {shelterSuccess && <SuccessMsg msg={shelterSuccess} />}

                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold gap-2"
                    onClick={handleCreateShelter}
                    disabled={!shelterForm.name.trim() || creatingShelter}
                  >
                    <Plus className="w-4 h-4" />
                    {creatingShelter ? "Creating..." : "Create Shelter"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 bg-card/40 border-border/50">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold">All Shelters</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {loadingShelters ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 bg-muted/20" />)}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {shelters?.map((s: any) => {
                        const pct = s.capacity > 0
                          ? Math.round((s.currentOccupancy / s.capacity) * 100)
                          : 0;
                        return (
                          <div key={s.id} className="p-3 rounded-lg bg-muted/10 border border-border/30">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                  📍 {s.address || "No address"}
                                </p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded border capitalize shrink-0",
                                SHELTER_STATUS_STYLE[s.status] ?? "text-muted-foreground bg-muted/10 border-border/30"
                              )}>
                                {s.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                              <span>{s.currentOccupancy?.toLocaleString()} / {s.capacity?.toLocaleString()} people</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-green-500")}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {s.facilities?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {s.facilities.slice(0, 4).map((f: string) => (
                                  <Badge key={f} variant="outline" className="text-[9px] px-1 py-0 h-4 border-border/30 text-muted-foreground/70">
                                    {f}
                                  </Badge>
                                ))}
                                {s.facilities.length > 4 && (
                                  <span className="text-[9px] text-muted-foreground">+{s.facilities.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
