# Sitemap SEO Implementation Guide

## Overview
This guide explains the sitemap implementation for Blinno Marketplace to ensure maximum SEO visibility across all search engines.

## Sitemap URLs

### Primary Sitemap (Static)
**URL:** `https://www.blinno.app/sitemap.xml`

This is a static XML file located in `/public/sitemap.xml` that includes:
- Homepage and main pages
- All category pages
- Information pages (About, Contact, Help, etc.)
- Legal pages (Terms, Privacy, Cookie Policy, etc.)

### Dynamic Sitemap (Edge Function)
**URL:** `https://[project-ref].supabase.co/functions/v1/sitemap`

This Edge Function generates a dynamic sitemap that includes:
- All static pages (from the static sitemap)
- **All active products** (up to 10,000)
- **All seller storefronts** (up to 1,000)
- Automatically updates when products/sellers are added/updated

## Implementation Details

### 1. Static Sitemap (`/public/sitemap.xml`)
- **Location:** `public/sitemap.xml`
- **Content:** Static pages with fixed priorities and change frequencies
- **Update Frequency:** Manual (update `lastmod` dates when pages change)
- **Best For:** Core pages that don't change frequently

### 2. Dynamic Sitemap (Edge Function)
- **Location:** `supabase/functions/sitemap/index.ts`
- **Content:** Dynamically generated from database
- **Update Frequency:** Real-time (generated on each request)
- **Best For:** Products, seller profiles, and other dynamic content
- **Caching:** 1 hour (3600 seconds)

### 3. Robots.txt Configuration
- **Location:** `public/robots.txt`
- **Sitemap References:**
  ```
  Sitemap: https://www.blinno.app/sitemap.xml
  Sitemap: https://www.blinno.app/api/sitemap
  ```

## SEO Best Practices

### Priority Levels
- **1.0:** Homepage (highest priority)
- **0.9:** Main marketplace pages (Products)
- **0.8:** Category pages
- **0.7:** Product pages, Information pages
- **0.6:** Seller storefronts, Secondary pages
- **0.5:** Legal pages, API docs

### Change Frequencies
- **daily:** Homepage, Products listing
- **weekly:** Category pages, Product pages, Seller storefronts
- **monthly:** Information pages, Help pages
- **yearly:** Legal pages, Terms of Service

## Submitting to Search Engines

### Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://www.blinno.app`
3. Navigate to **Sitemaps** section
4. Submit: `https://www.blinno.app/sitemap.xml`
5. (Optional) Submit Edge Function URL if using dynamic sitemap

### Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add site: `https://www.blinno.app`
3. Navigate to **Sitemaps** section
4. Submit: `https://www.blinno.app/sitemap.xml`

### Other Search Engines
- **Yandex:** [Webmaster Tools](https://webmaster.yandex.com/)
- **Baidu:** [Webmaster Tools](https://ziyuan.baidu.com/) (for China)
- **DuckDuckGo:** Automatically crawls (no submission needed)

## Testing Your Sitemap

### Validate XML Format
```bash
# Using curl
curl https://www.blinno.app/sitemap.xml

# Using wget
wget https://www.blinno.app/sitemap.xml
```

### Online Validators
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Google Search Console Sitemap Tester](https://search.google.com/search-console)

### Check in Browser
Simply visit:
- `https://www.blinno.app/sitemap.xml` (static)
- `https://[project-ref].supabase.co/functions/v1/sitemap` (dynamic)

## Maintenance

### When to Update Static Sitemap
- New static pages are added
- Page priorities change
- URLs are restructured

### Edge Function Auto-Updates
The dynamic sitemap automatically includes:
- New products (when `is_active = true`)
- Updated products (based on `updated_at`)
- New seller storefronts
- Updated seller profiles

### Monitoring
- Check Google Search Console for sitemap errors
- Monitor Edge Function logs for sitemap generation issues
- Review sitemap coverage in Search Console

## Troubleshooting

### Sitemap Not Found (404)
- Ensure `public/sitemap.xml` exists
- Check hosting configuration (Netlify, Vercel, etc.) to serve static files
- Verify Edge Function is deployed: `supabase functions deploy sitemap`

### Sitemap Empty or Missing URLs
- Check database for active products: `SELECT COUNT(*) FROM products WHERE is_active = true`
- Verify Edge Function has proper database access
- Check Edge Function logs for errors

### Search Engines Not Indexing
- Ensure `robots.txt` allows crawling
- Submit sitemap to Search Console
- Wait 24-48 hours for initial crawl
- Check for `noindex` meta tags on pages

## Additional SEO Recommendations

1. **Structured Data:** Add JSON-LD schema markup to product pages
2. **Meta Tags:** Ensure all pages have unique titles and descriptions
3. **Canonical URLs:** Set canonical tags to prevent duplicate content
4. **Image Alt Text:** Add descriptive alt text to all product images
5. **Internal Linking:** Link between related products and categories
6. **Page Speed:** Optimize images and code for fast loading
7. **Mobile-Friendly:** Ensure responsive design (already implemented)

## Sitemap Limits

- **Maximum URLs per sitemap:** 50,000
- **Maximum file size:** 50MB (uncompressed)
- **Current implementation:** Up to 10,000 products + 1,000 sellers + static pages

If you exceed these limits, consider:
- Creating multiple sitemaps (sitemap index)
- Splitting by category or date
- Using pagination in Edge Function

## Next Steps

1. ✅ Static sitemap created
2. ✅ Dynamic sitemap Edge Function created
3. ✅ Robots.txt updated
4. ⏳ Deploy Edge Function: `supabase functions deploy sitemap`
5. ⏳ Submit to Google Search Console
6. ⏳ Submit to Bing Webmaster Tools
7. ⏳ Monitor indexing status

## Support

For issues or questions:
- Check Edge Function logs: `supabase functions logs sitemap`
- Review Search Console for errors
- Test sitemap URLs manually

