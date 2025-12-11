import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Mail,
  Shield,
  Settings,
  ChevronLeft,
  ShieldCheck,
  BarChart3,
  Package,
  Banknote,
  MessageSquare,
} from "lucide-react";
import blinnoLogo from "@/assets/blinno-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

const menuItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Moderation", url: "/admin/moderation", icon: MessageSquare },
  { title: "Withdrawals", url: "/admin/withdrawals", icon: Banknote },
  { title: "Newsletter", url: "/admin/newsletter", icon: Mail },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Security", url: "/admin/security", icon: Shield },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        <div className="px-3 mb-6">
          <div className="flex items-center gap-2">
            <img src={blinnoLogo} alt="Blinno" className="h-9 w-9 shrink-0" />
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight">Admin Panel</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminDashboard() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !hasRole("admin")) {
      navigate("/");
    }
  }, [user, loading, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasRole("admin")) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-8 max-w-md text-center shadow-sm"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 gap-4">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Store
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}