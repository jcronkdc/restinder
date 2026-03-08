import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { signUp, signIn, resetPassword } from "../lib/supabase";

export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const data = await signUp(email.trim(), password, name.trim());
        if (data.user && !data.session) {
          setMessage("Check your email to confirm your account!");
          setMode("login");
        } else {
          onAuth(data.session);
        }
      } else if (mode === "login") {
        const data = await signIn(email.trim(), password);
        onAuth(data.session);
      } else if (mode === "forgot") {
        await resetPassword(email.trim());
        setMessage("Password reset email sent! Check your inbox.");
        setMode("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden noise-overlay">
      <div className="animated-bg">
        <div className="animated-bg-orb" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-center z-10 max-w-sm w-full"
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-bg mb-5 glow-pink"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="w-10 h-10 text-white drop-shadow-lg" />
          </motion.div>
          <h1 className="text-5xl font-extrabold gradient-text mb-2 tracking-tight">
            Restinder
          </h1>
          <p className="text-brand-muted text-sm mb-7 font-medium">
            {mode === "login"
              ? "Welcome back! Sign in to continue."
              : mode === "signup"
                ? "Create your account to get started."
                : "We'll send you a reset link."}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-sm"
            >
              {message}
            </motion.div>
          )}

          <form
            onSubmit={handleSubmit}
            className="glass-strong rounded-2xl p-5 space-y-3"
          >
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-brand-muted/60 focus:outline-none focus:border-brand-purple/40 transition-all duration-300"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-brand-muted/60 focus:outline-none focus:border-brand-purple/40 transition-all duration-300"
                required
                autoComplete="email"
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder-brand-muted/60 focus:outline-none focus:border-brand-purple/40 transition-all duration-300"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300 shadow-lg shadow-brand-pink/25 disabled:opacity-50 btn-shine active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login"
                    ? "Sign In"
                    : mode === "signup"
                      ? "Create Account"
                      : "Send Reset Link"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {mode === "login" && (
              <>
                <button
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-brand-muted text-xs hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
                <p className="text-brand-muted text-sm">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-brand-purple font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-brand-muted text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-brand-purple font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="text-brand-purple text-sm font-medium hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
