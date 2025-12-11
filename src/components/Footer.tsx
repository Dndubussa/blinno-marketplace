import { Link } from "react-router-dom";
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail
} from "lucide-react";
import blinnoLogo from "@/assets/blinno-logo.png";

const footerLinks = {
  marketplace: [
    { name: "Products", href: "/category/products", isRoute: true },
    { name: "E-Books", href: "/category/books", isRoute: true },
    { name: "Courses", href: "/category/courses", isRoute: true },
    { name: "Creators", href: "/category/creators", isRoute: true },
    { name: "Services", href: "/category/services", isRoute: true },
  ],
  company: [
    { name: "About Us", href: "/about", isRoute: true },
    { name: "Careers", href: "/careers", isRoute: true },
    { name: "Press", href: "/press", isRoute: true },
    { name: "Contact", href: "/contact", isRoute: true },
  ],
  support: [
    { name: "Help Center", href: "/help", isRoute: true },
    { name: "Safety", href: "/safety", isRoute: true },
    { name: "Community", href: "/community", isRoute: true },
    { name: "API Docs", href: "/api-docs", isRoute: true },
    { name: "Status", href: "/status", isRoute: true },
  ],
  legal: [
    { name: "Terms of Service", href: "/terms", isRoute: true },
    { name: "Privacy Policy", href: "/privacy", isRoute: true },
    { name: "Cookie Policy", href: "/cookie-policy", isRoute: true },
    { name: "Seller Agreement", href: "/seller-agreement", isRoute: true },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={blinnoLogo} alt="Blinno" className="h-9 w-9" />
              <span className="text-xl font-bold tracking-tight text-foreground">Blinno</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The everything marketplace. Empowering creators, sellers, and businesses 
              to reach their full potential.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground">Marketplace</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.marketplace.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Support</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 lg:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Subscribe to our newsletter for updates</span>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-10 rounded-lg border border-input bg-white px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
              Subscribe
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Blinno. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
