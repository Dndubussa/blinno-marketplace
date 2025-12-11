import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  ChevronLeft,
  Store,
  HelpCircle,
  Wallet,
  Loader2,
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
import { SellerOnboardingTour, useSellerOnboardingTour } from "@/components/SellerOnboardingTour";
import { supabase } from "@/integrations/supabase/client";

import { MessageSquare } from "lucide-react";

const menuItems = [
  { title: "Overview", url: "/seller", icon: LayoutDashboard },
  { title: "Products", url: "/seller/products", icon: Package },
  { title: "Orders", url: "/seller/orders", icon: ShoppingCart },
  { title: "Messages", url: "/seller/messages", icon: MessageSquare },
  { title: "Earnings", url: "/seller/earnings", icon: Wallet },
  { title: "Analytics", url: "/seller/analytics", icon: BarChart3 },
  { title: "Settings", url: "/seller/settings", icon: Settings },
];

import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

function SellerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        <div className="px-3 mb-6">
          <div className="flex items-center gap-2">
            <img src={blinnoLogo} alt="Blinno" className="h-9 w-9 shrink-0" />
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight">Seller Hub</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/seller"}
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
        
        {/* Marketplace link */}
        <SidebarGroup>
          <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/products"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ShoppingBag className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Browse & Buy</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function SellerDashboard() {
  const { user, loading, hasRole, becomeSeller } = useAuth();
  const navigate = useNavigate();
  const { showTour, startTour, closeTour, completeTour } = useSellerOnboardingTour();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Check if seller has a subscription/pricing model selected
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !hasRole("seller")) {
        setCheckingSubscription(false);
        return;
      }

      const { data, error } = await supabase
        .from("seller_subscriptions")
        .select("id")
        .eq("seller_id", user.id)
        .maybeSingle();

      setHasSubscription(!!data);
      setCheckingSubscription(false);
    };

    if (user && hasRole("seller")) {
      checkSubscription();
    } else {
      setCheckingSubscription(false);
    }
  }, [user, hasRole]);

  if (loading || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not a seller, show upgrade prompt
  if (!hasRole("seller")) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-8 max-w-md text-center shadow-sm"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mx-auto mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Become a Seller</h1>
          <p className="text-muted-foreground mb-6">
            Upgrade your account to start selling on Blinno. List products, manage
            orders, and grow your business.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => becomeSeller()}>
              Become a Seller
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If seller hasn't selected pricing model, redirect to onboarding
  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-8 max-w-md text-center shadow-sm"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mx-auto mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Complete Your Setup</h1>
          <p className="text-muted-foreground mb-6">
            You need to choose a pricing plan before you can access your seller dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/onboarding", { state: { role: "seller" } })}>
              Choose Pricing Plan
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SellerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 gap-4">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Store
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={startTour}>
              <HelpCircle className="mr-1 h-4 w-4" />
              Tour
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <SellerOnboardingTour
        isOpen={showTour}
        onClose={closeTour}
        onComplete={completeTour}
      />
    </SidebarProvider>
  );
}
