import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, User, LogOut, Store, ShoppingBag, Shield, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CartButton } from "@/components/cart/CartButton";
import { useWishlist } from "@/hooks/useWishlist";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import blinnoLogo from "@/assets/blinno-logo.png";

const navLinks = [
  { name: "Products", href: "/category/products", isRoute: true },
  { name: "E-Books", href: "/category/books", isRoute: true },
  { name: "Creators", href: "/category/creators", isRoute: true },
  { name: "Courses", href: "/category/courses", isRoute: true },
  { name: "Services", href: "/category/services", isRoute: true },
  { name: "Events", href: "/category/events", isRoute: true },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut, hasRole, loading } = useAuth();
  const { totalItems: wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm"
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={blinnoLogo} alt="Blinno" className="h-9 w-9" />
          <span className="text-xl font-bold tracking-tight text-foreground">Blinno</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/search")}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/wishlist")}
          >
            <Heart className="h-5 w-5" />
            {wishlistItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                {wishlistItems > 99 ? "99+" : wishlistItems}
              </span>
            )}
          </Button>
          <CartButton />
          
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile?.full_name || "User"}</span>
                    <span className="text-xs text-muted-foreground">
                      {hasRole("admin") ? "Admin" : hasRole("seller") ? "Seller" : "Buyer"}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {hasRole("admin") && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                {hasRole("seller") && (
                  <DropdownMenuItem onClick={() => navigate("/seller")}>
                    <Store className="mr-2 h-4 w-4" />
                    Seller Dashboard
                  </DropdownMenuItem>
                )}
                {!hasRole("seller") && (
                  <DropdownMenuItem onClick={() => navigate("/seller")}>
                    <Store className="mr-2 h-4 w-4" />
                    Become a Seller
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/sign-in")}>
                Sign In
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/sign-up")}>
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 hover:bg-muted md:hidden"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border bg-white md:hidden"
        >
          <div className="container flex flex-col gap-4 px-4 py-6">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.name}
                </a>
              )
            )}
            <div className="flex flex-col gap-2 pt-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 py-2 border-t border-border">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile?.full_name || "User"}</span>
                  </div>
                  <Button variant="ghost" onClick={() => { navigate("/seller"); setIsOpen(false); }}>
                    <Store className="mr-2 h-4 w-4" />
                    {hasRole("seller") ? "Seller Dashboard" : "Become a Seller"}
                  </Button>
                  <Button variant="ghost" onClick={() => { navigate("/profile"); setIsOpen(false); }}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button variant="destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/sign-in")}>
                    Sign In
                  </Button>
                  <Button variant="hero" onClick={() => navigate("/sign-up")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
