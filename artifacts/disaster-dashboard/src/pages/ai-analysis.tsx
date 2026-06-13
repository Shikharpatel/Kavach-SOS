import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAnalyzeDisasterImage, useListAiPredictions, useListIncidents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Brain, Scan, AlertTriangle, Zap, Users, BarChart2, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DAMAGE_COLORS: Record<string, string> = {
  minimal: "text-green-400 bg-green-500/10 border-green-500/20",
  moderate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  severe: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  catastrophic: "text-red-400 bg-red-500/10 border-red-500/20",
};

const TYPE_COLORS: Record<string, string> = {
  image_analysis: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  action_plan: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  severity_prediction: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "bg-green-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-semibold tabular-nums w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function AiAnalysis() {
  const [imageUrl, setImageUrl] = useState("");
  const [incidentId, setIncidentId] = useState("");
  const [result, setResult] = useState<any>(null);

  const { data: incidents } = useListIncidents();
  const { data: predictions, isLoading: loadingPredictions } = useListAiPredictions();
  const { mutateAsync: analyze, isPending } = useAnalyzeDisasterImage();

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    try {
      const res = await analyze({
        data: {
          imageUrl,
          incidentId: incidentId ? parseInt(incidentId) : undefined,
        },
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Image Analysis</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            CNN-powered damage assessment from satellite and ground imagery
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Input panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Scan className="w-4 h-4 text-blue-400" />
                  Analyze Disaster Image
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Image URL</Label>
                  <Input
                    placeholder="https://example.com/disaster-image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="text-sm bg-muted/20 border-border/50 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Link to Incident (optional)</Label>
                  <Select value={incidentId} onValueChange={setIncidentId}>
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

                {/* Sample images */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Quick samples</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Flood", url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800" },
                      { label: "Fire", url: "https://images.unsplash.com/photo-1602736052347-b61a7f18e85c?w=800" },
                      { label: "Earthquake", url: "https://images.unsplash.com/photo-1614728894747-a83421789f10?w=800" },
                      { label: "Cyclone", url: "https://images.unsplash.com/photo-1504608524841-42584120d693?w=800" },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setImageUrl(s.url)}
                        className="text-xs px-2 py-1.5 rounded-md bg-muted/20 border border-border/40 hover:bg-muted/40 hover:border-blue-500/40 transition-colors text-left truncate"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2"
                  onClick={handleAnalyze}
                  disabled={!imageUrl || isPending}
                >
                  <Brain className="w-4 h-4" />
                  {isPending ? "Analyzing..." : "Run AI Analysis"}
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            {result && (
              <Card className="bg-card/40 backdrop-blur-sm border-blue-500/20 shadow-lg shadow-blue-900/10">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Analysis Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-4">
                  {result.imageUrl && (
                    <img
                      src={result.imageUrl}
                      alt="Analyzed"
                      className="w-full h-36 object-cover rounded-md border border-border/30"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/10 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Category</p>
                      <p className="text-sm font-semibold capitalize">{result.category}</p>
                    </div>
                    <div className="bg-muted/10 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Severity</p>
                      <p className="text-sm font-bold text-orange-400">{result.severity}/10</p>
                    </div>
                    <div className="bg-muted/10 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Damage Level</p>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border capitalize", DAMAGE_COLORS[result.damageLevel] ?? "text-muted-foreground")}>
                        {result.damageLevel}
                      </span>
                    </div>
                    <div className="bg-muted/10 rounded-lg p-3">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Est. Casualties</p>
                      <p className="text-sm font-semibold text-red-400">{result.estimatedCasualties?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Model Confidence</p>
                    <ConfidenceBar value={result.confidenceScore ?? 0} />
                  </div>
                  {result.resourceSuggestions?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Suggested Resources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.resourceSuggestions.map((r: string) => (
                          <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-muted/20 border border-border/40 capitalize">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Predictions history */}
          <div className="lg:col-span-3">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50 h-full">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  Past AI Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {loadingPredictions ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full bg-muted/20 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {predictions?.map((pred: any) => {
                      let parsed: any = {};
                      try { parsed = JSON.parse(pred.result); } catch { /* empty */ }
                      return (
                        <div key={pred.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/10 border border-border/30 hover:border-border/60 transition-colors">
                          <div className="mt-0.5">
                            {pred.type === "image_analysis" && <Scan className="w-4 h-4 text-blue-400" />}
                            {pred.type === "action_plan" && <Zap className="w-4 h-4 text-purple-400" />}
                            {pred.type === "severity_prediction" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border capitalize", TYPE_COLORS[pred.type] ?? "bg-muted/20 text-muted-foreground border-border/30")}>
                                {pred.type.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-muted-foreground">Incident #{pred.incidentId}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              {parsed.category && <span className="text-muted-foreground capitalize">Category: <span className="text-foreground font-medium">{parsed.category}</span></span>}
                              {parsed.severity && <span className="text-muted-foreground">Severity: <span className="text-orange-400 font-medium">{parsed.severity}/10</span></span>}
                              {parsed.damageLevel && (
                                <span className={cn("capitalize font-medium", parsed.damageLevel === "catastrophic" ? "text-red-400" : parsed.damageLevel === "severe" ? "text-orange-400" : "text-yellow-400")}>
                                  {parsed.damageLevel}
                                </span>
                              )}
                              {parsed.estimatedCasualties && <span className="text-muted-foreground">Casualties: <span className="text-red-400 font-medium">{parsed.estimatedCasualties.toLocaleString()}</span></span>}
                              {parsed.requiredTeams && <span className="text-muted-foreground">Teams: <span className="text-foreground font-medium">{parsed.requiredTeams}</span></span>}
                              {parsed.evacuationUrgency && <span className="text-muted-foreground capitalize">Urgency: <span className="text-orange-400 font-medium">{parsed.evacuationUrgency}</span></span>}
                              {parsed.predictedSeverity && <span className="text-muted-foreground">Predicted: <span className="text-amber-400 font-medium">{parsed.predictedSeverity}/10</span></span>}
                              {parsed.trend && <span className="text-muted-foreground capitalize">Trend: <span className={cn("font-medium", parsed.trend === "escalating" ? "text-red-400" : parsed.trend === "stable" ? "text-green-400" : "text-yellow-400")}>{parsed.trend}</span></span>}
                              {parsed.timeToContainment && <span className="text-muted-foreground">Containment: <span className="text-foreground font-medium">{parsed.timeToContainment}</span></span>}
                            </div>
                            <div className="mt-2">
                              <ConfidenceBar value={pred.confidenceScore} />
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {new Date(pred.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
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
