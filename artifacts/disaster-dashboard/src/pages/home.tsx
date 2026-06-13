import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Activity, ArrowRight, Users, Radio, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useGetIncidentSummary, useListRescueTeams, useListShelters } from "@workspace/api-client-react";

export default function HomePage() {
  const { data: summary } = useGetIncidentSummary();
  const { data: teams } = useListRescueTeams();
  const { data: shelters } = useListShelters();

  const sheltersOnline = shelters?.filter((s: any) => s.status === "available").length ?? 8;
  const teamsDeployed = teams?.length ?? 10;

  return (
    <div className="min-h-screen bg-[#0a0d12] text-foreground flex flex-col relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/8 blur-[100px] rounded-full" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Shield className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-sm text-white">Kavach SOS</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-white/50">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/incidents" className="hover:text-white transition-colors">Incidents</Link>
            <Link href="/resources" className="hover:text-white transition-colors">Resources</Link>
            <Link href="/shelters" className="hover:text-white transition-colors">Shelters</Link>
            <Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link>
          </div>
          <Link href="/dashboard">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-400 text-white font-semibold text-xs h-8 px-4 shadow-lg shadow-orange-900/40">
              Launch Console
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            National Emergency Operations — Online
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-white mb-6">
            Disaster<br />
            response &amp;{" "}
            <span className="text-orange-400">resource</span>
            <br />
            <span className="text-orange-400">command</span>{" "}
            in real time
          </h1>

          <p className="text-base text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
            Kavach SOS unifies satellite imagery analysis, intelligent resource allocation, shelter
            routing, and live rescue coordination into one government-grade command center.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/dashboard">
              <Button className="h-10 px-6 bg-orange-500 hover:bg-orange-400 text-white font-semibold gap-2 shadow-lg shadow-orange-900/40">
                Open Command Center
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/incidents">
              <Button variant="outline" className="h-10 px-6 border-white/10 text-white/70 hover:bg-white/5 hover:text-white gap-2">
                <Activity className="w-4 h-4" />
                Report an Incident
              </Button>
            </Link>
          </div>

          <p className="text-xs text-white/25 font-mono">
            ⚡ Powered by Dijkstra routing, BFS shelter search &amp; greedy allocation
          </p>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl"
        >
          {[
            {
              icon: Users,
              value: summary?.populationAffected ? `${(summary.populationAffected / 1000).toFixed(1)}K+` : "346.7K+",
              label: "People Protected",
              color: "text-orange-400",
            },
            {
              icon: Activity,
              value: summary?.activeRescueOps ?? 7,
              label: "Active Operations",
              color: "text-red-400",
            },
            {
              icon: Radio,
              value: teamsDeployed,
              label: "Rescue Teams Deployed",
              color: "text-amber-400",
            },
            {
              icon: Home,
              value: sheltersOnline,
              label: "Shelters Online",
              color: "text-green-400",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white/3 border border-white/6 rounded-xl p-5 text-left hover:bg-white/5 hover:border-white/10 transition-all"
              >
                <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
                <div className="text-2xl font-bold text-white tabular-nums">{stat.value}</div>
                <div className="text-xs text-white/35 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer */}
      <div className="relative z-10 py-4 border-t border-white/5 text-center">
        <p className="text-xs text-white/20">
          built with love by Team 9/11 &nbsp;❤️&nbsp;❤️&nbsp;✈️
        </p>
      </div>
    </div>
  );
}
