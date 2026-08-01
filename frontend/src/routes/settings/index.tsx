import { createFileRoute } from "@tanstack/react-router";
import { Mail, Bell, Shield, Sparkles, RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationCard } from "@/components/integration-card";
import { CategoryManager } from "@/components/category-manager";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Mayday" },
      { name: "description", content: "Manage email integrations, AI categories, and notification preferences." },
      { property: "og:title", content: "Settings — Mayday" },
      { property: "og:description", content: "Manage email integrations, AI categories, and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

const integrations = [
  {
    id: "gmail",
    name: "Gmail",
    provider: "Google",
    status: "connected" as const,
    lastSync: "2 hours ago",
    email: "user@gmail.com",
  },
  {
    id: "imap",
    name: "IMAP inbox",
    provider: "Custom server",
    status: "disconnected" as const,
  },
  {
    id: "outlook",
    name: "Outlook",
    provider: "Microsoft",
    status: "disconnected" as const,
  },
];

function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage integrations, AI rules, and preferences.</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI rules
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Email scan preferences</CardTitle>
              <CardDescription>Choose how Mayday scans your inbox for new subscriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-scan">Automatic scanning</Label>
                  <p className="text-xs text-muted-foreground">Scan inbox daily for new receipts and renewal emails</p>
                </div>
                <Switch id="auto-scan" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="receipt-only">Receipt-only mode</Label>
                  <p className="text-xs text-muted-foreground">Only detect emails that look like payment receipts</p>
                </div>
                <Switch id="receipt-only" />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/30 px-6 py-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Run manual scan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <CategoryManager />
          <Card>
            <CardHeader>
              <CardTitle>AI confidence threshold</CardTitle>
              <CardDescription>Set the minimum confidence score before Mayday creates a subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="auto-create">Auto-create threshold</Label>
                  <Input id="auto-create" type="number" defaultValue={85} min={0} max={100} />
                  <p className="text-xs text-muted-foreground">Subscriptions above this score are created automatically</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review">Review threshold</Label>
                  <Input id="review" type="number" defaultValue={60} min={0} max={100} />
                  <p className="text-xs text-muted-foreground">Scores below this are flagged for manual review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>Choose when Mayday alerts you about your subscriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="renewal-alerts">Renewal reminders</Label>
                  <p className="text-xs text-muted-foreground">Get notified before subscriptions renew</p>
                </div>
                <Switch id="renewal-alerts" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-sub">New subscriptions detected</Label>
                  <p className="text-xs text-muted-foreground">Alert when a new subscription is found by AI</p>
                </div>
                <Switch id="new-sub" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="price-change">Price changes</Label>
                  <p className="text-xs text-muted-foreground">Notify when a subscription price changes</p>
                </div>
                <Switch id="price-change" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save changes
        </Button>
      </div>
    </div>
  );
}
