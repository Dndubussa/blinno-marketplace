import { motion } from "framer-motion";
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminSecurity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security</h1>
        <p className="text-muted-foreground">
          Monitor and configure platform security settings.
        </p>
      </div>

      {/* Security Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "SSL Certificate", status: "Active", icon: Lock, color: "text-green-500", bgColor: "bg-green-500/10" },
          { title: "2FA Enforcement", status: "Optional", icon: Key, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
          { title: "Login Alerts", status: "Enabled", icon: AlertTriangle, color: "text-green-500", bgColor: "bg-green-500/10" },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-semibold ${item.color}`}>{item.status}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure platform-wide security options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Login Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications when users sign in
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Password Change Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify users when their password is changed
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Suspicious Activity Detection</Label>
              <p className="text-sm text-muted-foreground">
                Alert users about unusual account activity
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Strong Passwords</Label>
              <p className="text-sm text-muted-foreground">
                Enforce minimum password complexity requirements
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Recent Security Events
          </CardTitle>
          <CardDescription>Latest security-related activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { event: "New login from Chrome on macOS", time: "2 minutes ago", status: "success" },
              { event: "Password changed successfully", time: "1 hour ago", status: "success" },
              { event: "Failed login attempt blocked", time: "3 hours ago", status: "warning" },
              { event: "New device registered", time: "5 hours ago", status: "success" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  {item.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{item.event}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}