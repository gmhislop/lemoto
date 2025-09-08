"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithMagicLink } from "./actions";
import { useActionState, useState } from "react";
import { ActionState } from "@/app/lib/auth/middleware";
import { createClient } from "@/app/utils/supabase/supabaseClient";
import config from "@/app/config";

export function Login({
  mode = "signin",
}: Readonly<{ mode?: "signin" | "signup" }>) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const handleGoogleSignIn = () => {
    const redirectTo = `${config.appUrl}/api/callback`;
    setLoading(true);
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectTo}?redirect=${encodeURIComponent("/app/dashboard")}`,
      },
    });
    setLoading(false);
  };

  const [magicLinkState, magicLinkAction, pending] = useActionState<
    ActionState,
    FormData
  >(signInWithMagicLink, { error: "", success: "" });

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="text-3xl">🚴‍♂️</div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Lemoto</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
            {mode === "signin" ? "Welcome back" : "Get started"}
          </h2>
          <p className="text-[17px] text-gray-700">
            {mode === "signin"
              ? "Sign in to your account"
              : "Create your account to start riding smart"}
          </p>
        </div>

        <div>
          {magicLinkState?.success ? (
            <div className="p-8 text-center bg-green-50 rounded-2xl border border-green-200">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-green-800 mb-2 tracking-tight">
                Check your email
              </h3>
              <p className="text-[17px] text-green-700">
                We've sent you a magic link to sign in to your account.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <form action={magicLinkAction} className="space-y-5">
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-[17px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                />
                <input type="hidden" name="redirect" value={redirect || ""} />

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-4 font-medium text-white bg-black rounded-2xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 text-[17px] disabled:opacity-50"
                >
                  {pending ? "Sending..." : "Continue with Email"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-[15px] text-gray-500 bg-white">
                    or
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 font-medium text-gray-900 bg-white rounded-2xl border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 text-[17px] disabled:opacity-50"
              >
                {loading ? (
                  "Connecting..."
                ) : (
                  <div className="flex justify-center items-center">
                    <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </div>
                )}
              </button>
            </div>
          )}

          {magicLinkState?.error && (
            <div className="mt-6 p-4 text-center bg-red-50 rounded-2xl border border-red-200">
              <p className="text-[15px] text-red-700">{magicLinkState.error}</p>
            </div>
          )}

          <p className="mt-8 text-center text-gray-700 text-[15px]">
            {mode === "signin"
              ? "New to Lemoto? "
              : "Already have an account? "}
            <Link
              href={`${mode === "signin" ? "/sign-up" : "/sign-in"}${
                redirect ? `?redirect=${redirect}` : ""
              }`}
              className="font-medium text-black hover:underline transition-all duration-200"
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
