import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PurchaseHistory } from "@/components/profile/PurchaseHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ShoppingBag } from "lucide-react";

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto max-w-4xl px-4 py-8 lg:px-8">
            <Skeleton className="h-10 w-48" />
            <div className="mt-8 space-y-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container mx-auto max-w-4xl px-4 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              My Account
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your profile and view your purchase history
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-4xl px-4 py-8 lg:px-8">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              if (value === "profile") {
                setSearchParams({});
              } else {
                setSearchParams({ tab: value });
              }
            }}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="purchases" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Purchases
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileForm />
            </TabsContent>

            <TabsContent value="purchases">
              <PurchaseHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
