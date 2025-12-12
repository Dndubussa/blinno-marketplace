import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { SavedSearchesProvider } from "@/hooks/useSavedSearches";
import { CartDrawer } from "@/components/cart/CartDrawer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Onboarding from "./pages/Onboarding";
import OnboardingPaymentCallback from "./pages/OnboardingPaymentCallback";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import SellerAgreement from "./pages/SellerAgreement";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Safety from "./pages/Safety";
import Community from "./pages/Community";
import ApiDocs from "./pages/ApiDocs";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";
import ProductsPage from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import OrderTracking from "./pages/OrderTracking";
import SearchPage from "./pages/Search";
import CategoryPage from "./pages/category/CategoryPage";
import SellerStorefront from "./pages/SellerStorefront";
import SellerDashboard from "./pages/seller/Dashboard";
import Overview from "./pages/seller/Overview";
import SellerProducts from "./pages/seller/Products";
import Orders from "./pages/seller/Orders";
import Analytics from "./pages/seller/Analytics";
import SellerEarnings from "./pages/seller/Earnings";
import Settings from "./pages/seller/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminNewsletter from "./pages/admin/Newsletter";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSecurity from "./pages/admin/Security";
import AdminSettings from "./pages/admin/Settings";
import PaymentAnalytics from "./pages/admin/PaymentAnalytics";
import AdminWithdrawals from "./pages/admin/Withdrawals";
import AdminModeration from "./pages/admin/Moderation";
import BuyerDashboard from "./pages/buyer/Dashboard";
import BuyerOverview from "./pages/buyer/Overview";
import BuyerOrders from "./pages/buyer/Orders";
import BuyerWishlist from "./pages/buyer/BuyerWishlist";
import BuyerPayments from "./pages/buyer/Payments";
import BuyerNotifications from "./pages/buyer/Notifications";
import BuyerSettings from "./pages/buyer/Settings";
import DigitalLibrary from "./pages/buyer/DigitalLibrary";
import BuyerMessages from "./pages/buyer/Messages";
import SellerMessages from "./pages/seller/Messages";
// Configure React Query to prevent unnecessary refetches on tab switch
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetching when window regains focus (tab switch)
      refetchOnWindowFocus: false,
      // Prevent refetching on reconnect (unless data is stale)
      refetchOnReconnect: false,
      // Prevent refetching on mount if data exists
      refetchOnMount: false,
      // Keep data fresh for 5 minutes (300000ms)
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime
      // Retry failed requests once
      retry: 1,
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <SavedSearchesProvider>
              <CartDrawer />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/payment-callback" element={<OnboardingPaymentCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/seller-agreement" element={<SellerAgreement />} />
                <Route path="/about" element={<About />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/press" element={<Press />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<Help />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/community" element={<Community />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/status" element={<Status />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/order/:orderId" element={<OrderTracking />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/seller/:sellerId" element={<SellerStorefront />} />
                
                {/* Buyer Dashboard Routes */}
                <Route path="/buyer" element={<BuyerDashboard />}>
                  <Route index element={<BuyerOverview />} />
                  <Route path="orders" element={<BuyerOrders />} />
                  <Route path="library" element={<DigitalLibrary />} />
                  <Route path="messages" element={<BuyerMessages />} />
                  <Route path="wishlist" element={<BuyerWishlist />} />
                  <Route path="payments" element={<BuyerPayments />} />
                  <Route path="notifications" element={<BuyerNotifications />} />
                  <Route path="settings" element={<BuyerSettings />} />
                </Route>

                {/* Seller Dashboard Routes */}
                <Route path="/seller" element={<SellerDashboard />}>
                  <Route index element={<Overview />} />
                  <Route path="products" element={<SellerProducts />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="messages" element={<SellerMessages />} />
                  <Route path="earnings" element={<SellerEarnings />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Admin Dashboard Routes */}
                <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="moderation" element={<AdminModeration />} />
                  <Route path="withdrawals" element={<AdminWithdrawals />} />
                  <Route path="newsletter" element={<AdminNewsletter />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="payments" element={<PaymentAnalytics />} />
                  <Route path="security" element={<AdminSecurity />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </SavedSearchesProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
