import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import config from "@/app/config";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Configure cookies for domain-wide access
              const cookieOptions = {
                ...options,
                domain: process.env.NODE_ENV === 'production' 
                  ? config.cookieDomain 
                  : undefined,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
              };
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}
