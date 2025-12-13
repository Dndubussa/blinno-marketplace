/**
 * Sitemap Edge Function
 * Generates dynamic XML sitemap for SEO
 * Accessible at: https://[project-ref].supabase.co/functions/v1/sitemap
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS configuration with origin validation
const ALLOWED_ORIGINS = [
  "https://www.blinno.app",
  "https://blinno.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(origin?: string | null): Record<string, string> {
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Default to production
  
  if (origin && typeof origin === "string") {
    const normalizedOrigin = origin.trim().toLowerCase();
    const isAllowed = ALLOWED_ORIGINS.some(
      (allowed) => allowed.toLowerCase() === normalizedOrigin
    );
    
    if (isAllowed) {
      allowedOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/xml",
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const baseUrl = "https://www.blinno.app";
    const currentDate = new Date().toISOString().split("T")[0];

    // Fetch active products
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(10000);

    // Fetch sellers with storefronts
    const { data: sellers } = await supabase
      .from("profiles")
      .select("id, updated_at")
      .not("seller_type", "is", null)
      .limit(1000);

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages with high priority
    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "daily" },
      { path: "/products", priority: "0.9", changefreq: "daily" },
      { path: "/category/products", priority: "0.8", changefreq: "weekly" },
      { path: "/category/books", priority: "0.8", changefreq: "weekly" },
      { path: "/category/creators", priority: "0.8", changefreq: "weekly" },
      { path: "/category/courses", priority: "0.8", changefreq: "weekly" },
      { path: "/category/services", priority: "0.8", changefreq: "weekly" },
      { path: "/category/events", priority: "0.8", changefreq: "weekly" },
      { path: "/about", priority: "0.7", changefreq: "monthly" },
      { path: "/contact", priority: "0.7", changefreq: "monthly" },
      { path: "/help", priority: "0.7", changefreq: "monthly" },
      { path: "/safety", priority: "0.7", changefreq: "monthly" },
      { path: "/community", priority: "0.7", changefreq: "monthly" },
      { path: "/careers", priority: "0.6", changefreq: "monthly" },
      { path: "/press", priority: "0.6", changefreq: "monthly" },
      { path: "/terms", priority: "0.5", changefreq: "yearly" },
      { path: "/privacy", priority: "0.5", changefreq: "yearly" },
      { path: "/cookie-policy", priority: "0.5", changefreq: "yearly" },
      { path: "/seller-agreement", priority: "0.5", changefreq: "yearly" },
    ];

    // Add static pages
    staticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add products
    if (products && products.length > 0) {
      products.forEach((product) => {
        const lastmod = product.updated_at
          ? new Date(product.updated_at).toISOString().split("T")[0]
          : currentDate;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/product/${product.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    // Add seller storefronts
    if (sellers && sellers.length > 0) {
      sellers.forEach((seller) => {
        const lastmod = seller.updated_at
          ? new Date(seller.updated_at).toISOString().split("T")[0]
          : currentDate;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/seller/${seller.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    xml += `</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error: any) {
    console.error("Error generating sitemap:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    );
  }
});

