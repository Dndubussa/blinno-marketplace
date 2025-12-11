import { useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import blinnoLogo from "@/assets/blinno-logo.png";
import {
  LayoutDashboard,
  Package,
  Heart,
  Settings,
  ShoppingBag,
  CreditCard,
  Bell,
  Store,
  Library,
} from "lucide-react";

import { MessageSquare } from "lucide-react";

const menuItems = [
  { title: "Overview", url: "/buyer", icon: LayoutDashboard },
  { title: "My Orders", url: "/buyer/orders", icon: Package },
  { title: "Digital Library", url: "/buyer/library", icon: Library },
  { title: "Messages", url: "/buyer/messages", icon: MessageSquare },
  { title: "Wishlist", url: "/buyer/wishlist", icon: Heart },
  { title: "Payments", url: "/buyer/payments", icon: CreditCard },
  { title: "Notifications", url: "/buyer/notifications", icon: Bell },
  { title: "Settings", url: "/buyer/settings", icon: Settings },
];

export default function BuyerDashboard() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <Sidebar className="border-r border-border">
          <div className="p-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <img src={blinnoLogo} alt="Blinno" className="h-8 w-8" />
              <span className="font-semibold text-foreground">My Account</span>
            </Link>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/buyer"}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                          activeClassName="bg-primary/10 text-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* Marketplace link */}
            <SidebarGroup>
              <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link
                        to="/products"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <Store className="h-4 w-4" />
                        <span>Browse Products</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1">
          <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-white">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
              <ShoppingBag className="mr-1 h-4 w-4" />
              Marketplace
            </Button>
            <div className="flex-1" />
            <h1 className="font-semibold text-foreground">Buyer Dashboard</h1>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
