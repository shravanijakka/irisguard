import type { UserData } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useActor } from "@/hooks/useActor";
import {
  Activity,
  Clock,
  Database,
  FileText,
  Globe,
  HardDrive,
  Key,
  Lock,
  LogOut,
  Server,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardPageProps {
  token: bigint;
  username: string;
  onLogout: () => void;
}

const CLOUD_RESOURCES = [
  {
    name: "SecureVault_2026.enc",
    type: "Encrypted Archive",
    size: "2.4 GB",
    icon: Lock,
    status: "Protected",
    modified: "2 hours ago",
  },
  {
    name: "BiometricDB_Master",
    type: "Database Cluster",
    size: "18.7 GB",
    icon: Database,
    status: "Active",
    modified: "5 minutes ago",
  },
  {
    name: "CloudConfig_Prod.yaml",
    type: "Configuration",
    size: "142 KB",
    icon: FileText,
    status: "Protected",
    modified: "1 day ago",
  },
  {
    name: "auth-server-node-01",
    type: "Compute Instance",
    size: "8 vCPU / 32 GB RAM",
    icon: Server,
    status: "Running",
    modified: "Online",
  },
  {
    name: "iris-model-v3.pkl",
    type: "ML Model",
    size: "1.8 GB",
    icon: Activity,
    status: "Protected",
    modified: "3 days ago",
  },
  {
    name: "GlobalCDN-Asia-01",
    type: "CDN Endpoint",
    size: "∞ Bandwidth",
    icon: Globe,
    status: "Active",
    modified: "Online",
  },
];

const RECENT_ACTIVITY = [
  {
    event: "Iris authentication verified",
    time: "Just now",
    color: "text-success",
  },
  {
    event: "Biometric template loaded",
    time: "Just now",
    color: "text-primary",
  },
  { event: "Session token issued", time: "Just now", color: "text-primary" },
  { event: "Security audit passed", time: "1 min ago", color: "text-success" },
];

const SECURITY_STATS = [
  {
    label: "Threat Level",
    value: "NONE",
    color: "text-success",
    icon: ShieldCheck,
  },
  { label: "Auth Factor", value: "2FA", color: "text-primary", icon: Key },
  { label: "Uptime", value: "99.9%", color: "text-primary", icon: Activity },
];

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts / 1_000_000n);
    return new Date(ms).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}

export default function DashboardPage({
  token,
  username,
  onLogout,
}: DashboardPageProps) {
  const { actor } = useActor();
  const [profile, setProfile] = useState<UserData | null>(null);
  const [storageUsed] = useState(67);

  useEffect(() => {
    if (!actor) return;
    actor
      .getProfile(token)
      .then(setProfile)
      .catch(() => {});
  }, [actor, token]);

  return (
    <div className="min-h-screen grid-bg hex-overlay flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-primary tracking-tight">
              IRISGUARD
            </span>
            <Separator orientation="vertical" className="h-4" />
            <Badge
              variant="outline"
              className="font-mono text-xs text-success border-success/50 bg-success/10"
            >
              ● AUTHENTICATED
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground hidden sm:block">
              Session: {token.toString().substring(0, 12)}...
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="font-mono text-xs uppercase tracking-wider border-destructive/50 text-destructive hover:bg-destructive/10"
              data-ocid="dashboard.logout_button"
            >
              <LogOut className="w-3 h-3 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main
        className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6"
        data-ocid="dashboard.panel"
      >
        <div
          className="rounded-lg border border-success/40 bg-success/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ boxShadow: "0 0 30px oklch(0.62 0.17 150 / 0.1)" }}
        >
          <div className="w-14 h-14 rounded-full border-2 border-success bg-success/10 flex items-center justify-center flex-shrink-0 success-ring-anim">
            <ShieldCheck className="w-7 h-7 text-success" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-display font-bold text-success">
                ACCESS GRANTED
              </h2>
              <Badge className="font-mono text-xs bg-success/20 text-success border-success/40">
                Clearance Level 5
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              Biometric verification complete. Iris pattern matched. Welcome
              back,{" "}
              <span className="text-foreground font-semibold">{username}</span>.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-mono text-muted-foreground">
              Auth Method
            </p>
            <p className="text-sm font-mono text-primary">Iris + Password</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 rounded-lg border border-border bg-card/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider">
                Identity Profile
              </h3>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full border-2 border-primary/50 bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-display font-bold text-primary">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground font-mono text-xs">
                    Username
                  </span>
                  <span className="font-mono text-foreground">
                    {profile?.username ?? username}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground font-mono text-xs">
                    User ID
                  </span>
                  <span className="font-mono text-primary text-xs">
                    #{profile ? profile.id.toString() : "..."}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground font-mono text-xs">
                    Registered At
                  </span>
                  <span className="font-mono text-foreground text-xs">
                    {profile
                      ? formatTimestamp(profile.registeredAt)
                      : "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground font-mono text-xs">
                    Biometric
                  </span>
                  <Badge className="font-mono text-xs bg-success/10 text-success border-success/30">
                    Verified ✓
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {SECURITY_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border bg-card/60 p-3 text-center"
                >
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <div
                    className={`text-lg font-display font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span className="font-display font-semibold text-sm">
                    Cloud Storage
                  </span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {storageUsed} GB / 100 GB
                </span>
              </div>
              <Progress value={storageUsed} className="h-2 bg-muted" />
              <div className="flex justify-between mt-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {storageUsed}% used
                </span>
                <span className="text-xs font-mono text-primary">
                  {100 - storageUsed} GB free
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-display font-semibold text-sm">
                  Recent Activity
                </span>
              </div>
              <div className="space-y-2">
                {RECENT_ACTIVITY.map((activity) => (
                  <div
                    key={activity.event}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className={activity.color}>▸ {activity.event}</span>
                    <span className="text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold uppercase tracking-wider">
              Protected Cloud Resources
            </h3>
            <Badge variant="outline" className="font-mono text-xs ml-auto">
              {CLOUD_RESOURCES.length} resources
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CLOUD_RESOURCES.map((resource, i) => {
              const Icon = resource.icon;
              const isActive =
                resource.status === "Active" || resource.status === "Running";
              return (
                <div
                  key={resource.name}
                  className="rounded-lg border border-border bg-card/60 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                  data-ocid={`dashboard.item.${i + 1}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md border border-border bg-muted/40 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium truncate text-foreground">
                        {resource.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resource.type}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {resource.size}
                        </span>
                        <Badge
                          className={`text-xs font-mono ${
                            isActive
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-primary/10 text-primary border-primary/30"
                          }`}
                        >
                          {resource.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground">
                    Modified: {resource.modified}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground font-mono">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
