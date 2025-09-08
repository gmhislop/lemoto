import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie
            .split(';')
            .map(cookie => cookie.trim())
            .filter(cookie => cookie.length > 0)
            .map(cookie => {
              const [name, ...valueParts] = cookie.split('=');
              return { name: name.trim(), value: valueParts.join('=') };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Configure cookies for domain-wide access
            const cookieOptions = {
              ...options,
              domain: process.env.NODE_ENV === 'production' 
                ? process.env.NEXT_PUBLIC_COOKIE_DOMAIN 
                : undefined,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            };
            
            let cookieString = `${name}=${value}`;
            
            if (cookieOptions.expires) {
              cookieString += `; expires=${cookieOptions.expires.toUTCString()}`;
            }
            if (cookieOptions.maxAge) {
              cookieString += `; max-age=${cookieOptions.maxAge}`;
            }
            if (cookieOptions.domain) {
              cookieString += `; domain=${cookieOptions.domain}`;
            }
            if (cookieOptions.path) {
              cookieString += `; path=${cookieOptions.path}`;
            }
            if (cookieOptions.secure) {
              cookieString += '; secure';
            }
            if (cookieOptions.sameSite) {
              cookieString += `; samesite=${cookieOptions.sameSite}`;
            }
            
            document.cookie = cookieString;
          });
        },
      },
    }
  );
}
