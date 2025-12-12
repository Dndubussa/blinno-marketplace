# Tab Switch Reload Fix - Implementation Summary

## Problem Identified

The platform was reloading/refetching data when users switched browser tabs and returned. This was caused by:

1. **React Query Default Behavior**: `refetchOnWindowFocus: true` (default)
2. **No State Persistence Configuration**: React Query was refetching all queries on window focus
3. **Potential Supabase Token Refresh**: Token refresh events might trigger unnecessary refetches

## Root Causes

### 1. React Query Configuration
- **Issue**: Default `QueryClient` had no configuration
- **Impact**: All queries refetched on window focus, causing:
  - Unnecessary API calls
  - UI flickering/reloading
  - Data loss in forms
  - Performance issues

### 2. Supabase Auth State Changes
- **Issue**: `TOKEN_REFRESHED` events might trigger profile/role refetches
- **Impact**: Unnecessary data fetching when tab becomes visible

### 3. No Visibility Change Handling
- **Issue**: No explicit handling of tab visibility changes
- **Impact**: Components might refetch data unnecessarily

## Solutions Implemented

### 1. React Query Configuration (`src/App.tsx`)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // ✅ Prevents refetch on tab switch
      refetchOnReconnect: false,    // ✅ Prevents refetch on reconnect
      refetchOnMount: false,        // ✅ Prevents refetch on mount if data exists
      staleTime: 5 * 60 * 1000,    // ✅ Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,      // ✅ Cache for 10 minutes
      retry: 1,                     // ✅ Retry failed requests once
    },
  },
});
```

### 2. Supabase Client Configuration (`src/integrations/supabase/client.ts`)
- ✅ Session persistence already configured
- ✅ Auto token refresh enabled (handles token refresh silently)
- ✅ Added client info header

### 3. Auth State Management (`src/hooks/useAuth.tsx`)
- ✅ Added visibility change handler
- ✅ Prevents unnecessary profile/role refetches on tab switch
- ✅ Supabase handles token refresh automatically

### 4. State Persistence (Already Implemented)
- ✅ Cart: Persisted in localStorage
- ✅ Wishlist: Persisted in localStorage
- ✅ Saved Searches: Persisted in localStorage
- ✅ Auth Session: Persisted by Supabase in localStorage

## Benefits

### ✅ No Unnecessary Refetches
- Queries only refetch when explicitly needed
- Data stays cached for 5 minutes
- No refetch on tab switch

### ✅ Better Performance
- Reduced API calls
- Faster page loads
- Less network usage

### ✅ Improved UX
- No UI flickering
- Form data preserved
- Seamless tab switching
- State maintained across tab switches

### ✅ State Persistence
- Cart, wishlist, and searches persist
- Auth session persists
- React Query cache persists

## Testing Checklist

- [ ] Switch tabs and return - no reload
- [ ] Fill form, switch tabs, return - form data preserved
- [ ] Add to cart, switch tabs, return - cart items preserved
- [ ] Browse products, switch tabs, return - product list maintained
- [ ] Check messages, switch tabs, return - messages still loaded
- [ ] Verify no unnecessary API calls in Network tab
- [ ] Verify React Query cache is used
- [ ] Test with multiple tabs open

## Manual Override for Specific Queries

If a specific query needs to refetch on window focus, you can override:

```typescript
const { data } = useQuery({
  queryKey: ["important-data"],
  queryFn: fetchData,
  refetchOnWindowFocus: true, // Override for this specific query
});
```

## Notes

- React Query cache persists in memory during tab switch
- Supabase subscriptions remain active (they don't cause reloads)
- Token refresh happens automatically and silently
- All state is preserved across tab switches

