import { MainLayout } from "@/components/layout/MainLayout";
import { useGetIncidentTrends, useGetIncidentsByCategory, useGetRegionImpact, useGetRescueEfficiency } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: trends, isLoading: loadingTrends } = useGetIncidentTrends();
  const { data: categories, isLoading: loadingCategories } = useGetIncidentsByCategory();
  const { data: regionImpact, isLoading: loadingRegion } = useGetRegionImpact();
  const { data: efficiency, isLoading: loadingEfficiency } = useGetRescueEfficiency();

  const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Global Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Deep-dive metrics on incident response and operational efficiency</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Avg Response Time" value={efficiency ? `${Math.round(efficiency.avgResponseMinutes)}m` : '-'} loading={loadingEfficiency} />
          <MetricCard title="Teams Deployed" value={efficiency?.teamsDeployed} loading={loadingEfficiency} />
          <MetricCard title="Success Rate" value={efficiency ? `${Math.round(efficiency.successRate * 100)}%` : '-'} loading={loadingEfficiency} />
          <MetricCard title="Avg Coverage" value={efficiency ? `${Math.round(efficiency.avgCoverageKm)}km` : '-'} loading={loadingEfficiency} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/40 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">Regional Impact</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRegion ? <Skeleton className="h-[300px] w-full bg-muted/20" /> : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionImpact} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="region" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      />
                      <Bar dataKey="totalAffected" name="Affected Population" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">Incident Composition</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCategories ? <Skeleton className="h-[300px] w-full bg-muted/20" /> : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categories}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, textTransform: 'capitalize' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                      <Radar name="Incidents" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                    </RadarChart>
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

function MetricCard({ title, value, loading }: any) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50">
      <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </p>
        {loading ? (
          <Skeleton className="h-10 w-24 bg-muted/30" />
        ) : (
          <div className="text-4xl font-bold font-mono text-primary">
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
