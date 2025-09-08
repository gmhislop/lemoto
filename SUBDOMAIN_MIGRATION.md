# Subdomain Migration Plan

This document outlines the plan for migrating from Option 3 (route groups) to Option 2 (subdomains).

## Current Architecture (Option 3 - Route Groups)

```
lemoto.com/                    -> Marketing landing page
lemoto.com/app/dashboard       -> App dashboard
lemoto.com/app/settings        -> App settings
lemoto.com/sign-in            -> Auth pages
lemoto.com/sign-up            -> Auth pages
```

## Target Architecture (Option 2 - Subdomains)

```
lemoto.com/                   -> Marketing landing page
app.lemoto.com/dashboard      -> App dashboard
app.lemoto.com/settings       -> App settings
app.lemoto.com/sign-in        -> Auth pages
app.lemoto.com/sign-up        -> Auth pages
```

## Migration Steps

### Phase 1: Preparation (Already Complete ✅)

1. **Route Groups Structure**: Created `(marketing)/(app)/(auth)` route groups
2. **Domain-wide Cookies**: Configured auth cookies for `.lemoto.com`
3. **Environment Variables**: Set up `NEXT_PUBLIC_MARKETING_URL` and `NEXT_PUBLIC_APP_URL`
4. **Absolute URLs**: Updated all internal links to use env vars
5. **Middleware**: Added route type headers and redirect logic

### Phase 2: DNS & Deployment Setup

1. **DNS Configuration**:
   ```
   A     lemoto.com          -> Marketing site IP
   CNAME app.lemoto.com      -> App deployment URL
   ```

2. **Deployment Setup**:
   - Marketing site: Deploy to `lemoto.com`
   - App site: Deploy to `app.lemoto.com`

3. **Environment Variables Update**:
   ```bash
   # Production environment
   NEXT_PUBLIC_MARKETING_URL=https://lemoto.com
   NEXT_PUBLIC_APP_URL=https://app.lemoto.com
   NEXT_PUBLIC_DOMAIN=lemoto.com
   NEXT_PUBLIC_COOKIE_DOMAIN=.lemoto.com
   ```

### Phase 3: Route Migration

1. **Update Middleware**: Uncomment the production redirect logic in `middleware.ts`
2. **Test Redirects**: Verify `/app/*` routes redirect to `app.lemoto.com`
3. **Update Auth Callbacks**: Ensure OAuth redirects work across subdomains

### Phase 4: Content Separation

1. **Marketing Site**:
   - Only needs `(marketing)` route group
   - Remove app-related API routes
   - Optimize for SEO and performance

2. **App Site**:
   - Only needs `(app)` and `(auth)` route groups
   - Keep all API routes for app functionality
   - Add authentication middleware

## Files Ready for Migration

### Already Configured
- ✅ `.env.local` - Environment variables setup
- ✅ `config.ts` - Domain configuration
- ✅ `middleware.ts` - Redirect logic (commented for development)
- ✅ Supabase clients - Domain-wide cookie support
- ✅ Auth actions - Absolute URL redirects
- ✅ Components - Absolute URL links

### Migration Commands

```bash
# 1. Update environment for production
cp .env.local .env.production
# Edit .env.production to uncomment production URLs

# 2. Deploy marketing site (Route group: marketing only)
vercel --prod --env NODE_ENV=production

# 3. Deploy app site (Route groups: app + auth)
vercel --prod --env NODE_ENV=production --env NEXT_PUBLIC_MARKETING_URL=https://lemoto.com

# 4. Enable redirects
# Uncomment redirect logic in middleware.ts
```

## Benefits of This Architecture

1. **Performance**: Marketing and app can be optimized separately
2. **SEO**: Marketing site optimized for search, app site excluded
3. **Security**: App routes isolated from marketing content
4. **Scalability**: Each subdomain can scale independently
5. **Development**: Clean separation of concerns

## Rollback Plan

If issues occur during migration:

1. **Immediate**: Comment out redirect logic in `middleware.ts`
2. **DNS**: Point both domains to the same deployment
3. **Environment**: Revert to development URLs
4. **Test**: Verify all functionality works on single domain

## Testing Checklist

- [ ] Marketing site loads at `lemoto.com`
- [ ] App redirects from `lemoto.com/app/*` to `app.lemoto.com/*`
- [ ] Authentication works across subdomains
- [ ] Cookies persist between domains
- [ ] API calls work from app subdomain
- [ ] OAuth redirects work correctly