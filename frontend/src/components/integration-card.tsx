import { Mail, RefreshCw, CheckCircle2, AlertCircle, Plug } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  email?: string;
}

interface IntegrationCardProps {
  integration: Integration;
  onToggle?: (id: string, enabled: boolean) => void;
}

const statusConfig = {
  connected: { icon: CheckCircle2, label: "Connected", variant: "default" as const },
  disconnected: { icon: Plug, label: "Disconnected", variant: "outline" as const },
  error: { icon: AlertCircle, label: "Error", variant: "destructive" as const },
};

export function IntegrationCard({ integration, onToggle }: IntegrationCardProps) {
  const config = statusConfig[integration.status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <CardDescription className="text-xs">{integration.provider}</CardDescription>
            </div>
          </div>
          <Badge variant={config.variant}>
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {integration.email && (
          <p className="text-sm text-muted-foreground">
            Connected to <span className="font-medium text-foreground">{integration.email}</span>
          </p>
        )}
        {integration.lastSync && (
          <p className="text-xs text-muted-foreground">Last synced: {integration.lastSync}</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t bg-muted/30 px-6 py-3">
        <div className="flex items-center gap-2">
          <Switch
            id={`integration-${integration.id}`}
            checked={integration.status === "connected"}
            onCheckedChange={(checked) => onToggle?.(integration.id, checked)}
          />
          <label htmlFor={`integration-${integration.id}`} className="text-sm font-medium">
            Active
          </label>
        </div>
        <Button variant="outline" size="sm" className="h-8">
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Sync now
        </Button>
      </CardFooter>
    </Card>
  );
}
