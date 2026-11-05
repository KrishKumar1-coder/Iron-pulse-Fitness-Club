"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Lock, Mail, Key, 
  RefreshCw, Eye, EyeOff, ArrowRight, Clock, AlertOctagon 
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function AdminLoginPage() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Background non-blocking session check:
  // Shows login form instantly (0ms delay). If session exists, redirects smoothly.
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then((session) => {
      if (!isMounted) return;
      if (session?.user) {
        router.replace("/admin");
      }
    }).catch(() => {
      // Session fetch error: user remains on the login page cleanly
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Live countdown timer when rate-limit lockout is active
  useEffect(() => {
    if (!lockoutSeconds || lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (!prev || prev <= 1) {
          setLoginError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const isLockedOut = Boolean(lockoutSeconds && lockoutSeconds > 0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setLoginError(null);

    // 1. Bot Honeypot Trap
    if (honeypot.trim().length > 0) {
      setLoginError("Invalid credentials.");
      return;
    }

    const cleanEmail = emailInput.toLowerCase().trim();

    // 2. Generic validation: Never reveal which field failed
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail) || !passwordInput.trim() || passwordInput.length < 6) {
      setLoginError("Invalid credentials.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword(cleanEmail, passwordInput);
    setIsSubmitting(false);

    if (error) {
      const err = error as any;
      // Check if server rate limiter returned HTTP 429
      if (err.status === 429 || err.message?.includes("Too many") || err.retryAfter) {
        const secs = Number(err.retryAfter) || 60;
        setLockoutSeconds(secs);
        return;
      }

      // Generic response on wrong password/email: zero clues
      setLoginError("Invalid credentials.");
      return;
    }

    if (data?.session) {
      window.location.href = "/admin";
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center px-6 relative overflow-hidden select-none">
      {/* Ambient warm gold lighting */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] blur-[220px] rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(197, 160, 89, 0.12)" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#c5a059] font-medium tracking-widest uppercase mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Restricted Principal Access</span>
          </div>
          <h1 className="text-3xl font-heading font-light tracking-wide text-white">
            AURELIA <span className="italic font-medium text-[#c5a059]">Private Office</span>
          </h1>
          <p className="text-white/50 text-xs">
            Confidential administrative portal. Authorized estate principals only.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          {/* Restricted Notice */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70 flex items-center gap-2.5">
            <Lock className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
            <p className="text-[11px] text-white/60">
              Authorized administrative personnel only.
            </p>
          </div>

          {/* Active lockout banner with countdown timer */}
          {isLockedOut ? (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/60 text-red-200 text-xs space-y-2 animate-fade-in shadow-lg shadow-red-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-red-400">
                  <Clock className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Too many attempts</span>
                </div>
                <span className="font-mono font-bold text-white bg-red-900/60 px-2 py-0.5 rounded border border-red-500/40 text-xs">
                  {lockoutSeconds}s
                </span>
              </div>
              <p className="text-[11px] text-red-300/90 leading-relaxed">
                Please try again in {lockoutSeconds} seconds.
              </p>
            </div>
          ) : loginError ? (
            /* Generic Error Alert */
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs animate-fade-in flex items-center gap-2.5">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[12px]">{loginError}</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Hidden Honeypot Input for Automated Bot Detection */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 block uppercase tracking-wider">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  disabled={isLockedOut}
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (loginError && !isLockedOut) setLoginError(null);
                  }}
                  placeholder="Enter authorized principal email..."
                  required
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#c5a059] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 block uppercase tracking-wider">
                Secret Password
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  disabled={isLockedOut}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (loginError && !isLockedOut) setLoginError(null);
                  }}
                  placeholder="Enter secret password..."
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#c5a059] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={isLockedOut}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLockedOut}
              className={`w-full py-3.5 rounded-xl text-black font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg flex items-center justify-center gap-2 mt-2 ${
                isLockedOut
                  ? "bg-red-950/80 text-red-300 border border-red-500/50 cursor-not-allowed"
                  : "bg-[#c5a059] hover:bg-[#dfba74] hover:shadow-[#c5a059]/20 cursor-pointer disabled:opacity-50"
              }`}
            >
              {isLockedOut ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Try again in {lockoutSeconds}s</span>
                </>
              ) : isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5 text-center">
            <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">
              &larr; Return to Public Estate Site
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
