# Security Deployment Checklist

## ✅ **Completed Code Changes**

All security fixes have been committed and pushed to the repository:
- ✅ Order price manipulation fix
- ✅ Flutterwave webhook signature verification
- ✅ Public profile access restriction
- ✅ XSS protection with DOMPurify
- ✅ CORS restrictions in Edge Functions
- ✅ Input length limits migration
- ✅ CSP headers in index.html

---

## 🔄 **Pending Deployment Steps**

### **1. Database Migrations**

Two security migrations need to be applied:

#### **Migration 1: Restrict Public Profile Access**
**File:** `supabase/migrations/20250120000001_restrict_public_profile_access.sql`

**SQL:**
```sql
-- Drop the overly permissive public profile policy
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

-- Create a new policy that allows authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
```

**How to Apply:**
- Option A: Via Supabase Dashboard
  1. Go to Supabase Dashboard → SQL Editor
  2. Copy and paste the SQL from the migration file
  3. Run the query

- Option B: Via Supabase CLI
  ```bash
  supabase db push
  ```

- Option C: Via Supabase MCP (if available)
  - Use `apply_migration` tool with the migration SQL

#### **Migration 2: Add Input Length Limits**
**File:** `supabase/migrations/20250120000002_add_input_length_limits.sql`

**What it does:**
- Adds VARCHAR length limits to text fields
- Adds CHECK constraints for content length
- Adds constraints for order amounts, quantities, prices
- Creates search indexes for performance

**How to Apply:**
- Same as Migration 1 (Dashboard, CLI, or MCP)

**⚠️ Important:** 
- Test existing data first to ensure no violations
- Some existing data might need to be truncated if it exceeds limits

---

### **2. Edge Functions Deployment**

The following Edge Functions have been updated with CORS restrictions and need to be redeployed:

1. **flutterwave-payment** - Payment processing
2. **flutterwave-webhook** - Payment webhook handler
3. **get-signed-url** - File access control
4. **sitemap** - SEO sitemap generation
5. **newsletter-subscribe** - Newsletter subscriptions
6. **seller-withdrawal** - Seller withdrawal requests
7. **get-mapbox-token** - Mapbox token retrieval

**How to Deploy:**

#### **Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. For each function:
   - Click on the function name
   - Click "Deploy" or "Update"
   - The code is already in the repository

#### **Option B: Via Supabase CLI**
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific functions
supabase functions deploy flutterwave-payment
supabase functions deploy flutterwave-webhook
supabase functions deploy get-signed-url
supabase functions deploy sitemap
supabase functions deploy newsletter-subscribe
supabase functions deploy seller-withdrawal
supabase functions deploy get-mapbox-token
```

#### **Option C: Via Supabase MCP**
- Use `deploy_edge_function` tool for each function

---

### **3. Frontend Deployment**

The frontend changes (CSP headers in `index.html`) will be automatically deployed when you push to your hosting platform (Vercel, Netlify, etc.).

**No additional steps needed** - the changes are already in the repository.

---

## 🧪 **Testing Checklist**

After deployment, test the following:

### **CORS Testing:**
- [ ] Test payment flow from production domain (should work)
- [ ] Test API calls from frontend (should work)
- [ ] Verify no CORS errors in browser console

### **CSP Testing:**
- [ ] Check browser console for CSP violations
- [ ] Verify all resources load correctly
- [ ] Test Supabase connections
- [ ] Test Flutterwave checkout
- [ ] Test image loading
- [ ] Test font loading

### **Input Limits Testing:**
- [ ] Try creating product with title > 200 chars (should fail)
- [ ] Try creating review with content > 2000 chars (should fail)
- [ ] Try sending message with content > 5000 chars (should fail)
- [ ] Verify existing data still works

### **Profile Access Testing:**
- [ ] Verify authenticated users can view profiles
- [ ] Verify anonymous users cannot view profiles
- [ ] Test seller storefront (should work for authenticated users)

### **Security Testing:**
- [ ] Test order creation with price validation
- [ ] Test payment webhook signature verification
- [ ] Test XSS protection (try injecting scripts in reviews/messages)

---

## 📊 **Deployment Status**

| Component | Status | Action Required |
|-----------|--------|----------------|
| Code Changes | ✅ Committed | None |
| Database Migration 1 | ⏳ Pending | Apply migration |
| Database Migration 2 | ⏳ Pending | Apply migration |
| Edge Functions | ⏳ Pending | Deploy 7 functions |
| Frontend | ✅ Ready | Auto-deploy on push |

---

## 🚨 **Important Notes**

1. **Database Migrations:**
   - Run migrations during low-traffic period
   - Backup database before running migrations
   - Test migrations on staging first if possible

2. **Edge Functions:**
   - Deploy during low-traffic period
   - Monitor function logs after deployment
   - Test critical payment flows immediately after deployment

3. **CSP Headers:**
   - Monitor browser console for violations
   - Adjust CSP policy if needed (some third-party services might need exceptions)

4. **Input Limits:**
   - Check existing data for violations before applying
   - May need to truncate some existing data
   - Inform users about new limits if needed

---

## 📞 **Support**

If you encounter issues during deployment:

1. **Migration Errors:**
   - Check Supabase logs
   - Verify table structures match expectations
   - Check for existing constraints that might conflict

2. **CORS Errors:**
   - Verify origin is in allowed list
   - Check Edge Function logs
   - Test with curl/Postman to isolate frontend issues

3. **CSP Violations:**
   - Check browser console for specific violations
   - Adjust CSP policy as needed
   - Some third-party services may need exceptions

---

**Last Updated:** January 2025  
**Status:** Ready for Deployment

