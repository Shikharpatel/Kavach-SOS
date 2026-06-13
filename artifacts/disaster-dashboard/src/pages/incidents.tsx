import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  useListIncidents,
  useDeleteIncident,
  useCreateIncident,
  useUpdateIncident,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, Plus, Trash2, Edit, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = ["flood", "earthquake", "cyclone", "fire", "landslide", "other"];
const STATUSES = ["active", "monitoring", "critical", "resolved"];

const emptyForm = {
  title: "",
  description: "",
  category: "flood",
  severity: 5,
  status: "active",
  latitude: 20.5937,
  longitude: 78.9629,
  affectedPopulation: 0,
  region: "",
  imageUrl: "",
};

type FormState = typeof emptyForm;

function IncidentDialog({
  open,
  onClose,
  initial,
  onSave,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  initial: FormState;
  onSave: (data: FormState) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // reset when initial changes (edit vs create)
  useState(() => { setForm(initial); });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {initial.title ? "Edit Incident" : "Log New Incident"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Incident title..." className="bg-muted/20 border-border/50" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detailed description..." className="bg-muted/20 border-border/50 min-h-20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category *</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status *</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-xs text-muted-foreground">Severity: <span className="font-bold text-foreground">{form.severity}/10</span></Label>
            <Slider min={1} max={10} step={1} value={[form.severity]} onValueChange={([v]) => set("severity", v)} className="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <Input type="number" value={form.latitude} onChange={(e) => set("latitude", parseFloat(e.target.value) || 0)} className="bg-muted/20 border-border/50 font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <Input type="number" value={form.longitude} onChange={(e) => set("longitude", parseFloat(e.target.value) || 0)} className="bg-muted/20 border-border/50 font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Region</Label>
            <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Mumbai Metropolitan" className="bg-muted/20 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Affected Population</Label>
            <Input type="number" value={form.affectedPopulation} onChange={(e) => set("affectedPopulation", parseInt(e.target.value) || 0)} className="bg-muted/20 border-border/50" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image URL (optional)</Label>
            <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://..." className="bg-muted/20 border-border/50" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            disabled={!form.title || loading}
            onClick={() => onSave(form)}
          >
            {loading ? "Saving..." : initial.title ? "Save Changes" : "Log Incident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Incidents() {
  const queryClient = useQueryClient();
  const { data: incidents, isLoading } = useListIncidents();
  const createMutation = useCreateIncident();
  const updateMutation = useUpdateIncident();
  const deleteMutation = useDeleteIncident();

  const [showCreate, setShowCreate] = useState(false);
  const [editIncident, setEditIncident] = useState<any>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });

  const handleCreate = async (form: FormState) => {
    await createMutation.mutateAsync({
      data: {
        title: form.title,
        description: form.description || undefined,
        category: form.category as any,
        severity: form.severity,
        status: form.status as any,
        latitude: form.latitude,
        longitude: form.longitude,
        affectedPopulation: form.affectedPopulation,
        region: form.region || undefined,
        imageUrl: form.imageUrl || undefined,
      },
    });
    invalidate();
    setShowCreate(false);
  };

  const handleEdit = async (form: FormState) => {
    await updateMutation.mutateAsync({
      id: editIncident.id,
      data: {
        title: form.title,
        description: form.description || undefined,
        category: form.category as any,
        severity: form.severity,
        status: form.status as any,
        latitude: form.latitude,
        longitude: form.longitude,
        affectedPopulation: form.affectedPopulation,
        region: form.region || undefined,
        imageUrl: form.imageUrl || undefined,
      },
    });
    invalidate();
    setEditIncident(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this incident? This cannot be undone.")) return;
    await deleteMutation.mutateAsync({ id });
    invalidate();
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Incident Log</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and track ongoing disaster incidents</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2 h-9"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4" /> Log Incident
          </Button>
        </div>

        <Card className="bg-card/40 backdrop-blur-sm border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-muted/20" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-16">ID</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Title</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Category</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Severity</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Region</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Logged</div>
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents?.map((incident) => (
                      <TableRow key={incident.id} className="border-border/50 hover:bg-muted/5 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{incident.id.toString().padStart(4, "0")}
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-48">
                          <div className="truncate">{incident.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/5">
                            {incident.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={i}
                                  className={cn("w-1 h-3 rounded-sm", i < incident.severity
                                    ? incident.severity > 7 ? "bg-red-500" : incident.severity > 4 ? "bg-amber-500" : "bg-green-500"
                                    : "bg-muted/30")}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-mono font-bold">{incident.severity}/10</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("capitalize text-[10px] border-transparent font-semibold",
                              incident.status === "active" ? "bg-blue-500/20 text-blue-400" :
                              incident.status === "critical" ? "bg-red-500/20 text-red-400 animate-pulse" :
                              incident.status === "resolved" ? "bg-green-500/20 text-green-400" :
                              "bg-muted/30 text-muted-foreground")}
                          >
                            {incident.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-28">
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{(incident as any).region ?? "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {format(new Date(incident.createdAt), "dd MMM, HH:mm")}
                          </div>
                          {incident.updatedAt !== incident.createdAt && (
                            <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                              upd {format(new Date(incident.updatedAt), "HH:mm")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-blue-400"
                              onClick={() => setEditIncident(incident)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-400"
                              onClick={() => handleDelete(incident.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {incidents?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No incidents logged.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <IncidentDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        initial={emptyForm}
        onSave={handleCreate}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editIncident && (
        <IncidentDialog
          open={!!editIncident}
          onClose={() => setEditIncident(null)}
          initial={{
            title: editIncident.title ?? "",
            description: editIncident.description ?? "",
            category: editIncident.category ?? "flood",
            severity: editIncident.severity ?? 5,
            status: editIncident.status ?? "active",
            latitude: editIncident.latitude ?? 20.5,
            longitude: editIncident.longitude ?? 78.9,
            affectedPopulation: editIncident.affectedPopulation ?? 0,
            region: (editIncident as any).region ?? "",
            imageUrl: editIncident.imageUrl ?? "",
          }}
          onSave={handleEdit}
          loading={updateMutation.isPending}
        />
      )}
    </MainLayout>
  );
}
