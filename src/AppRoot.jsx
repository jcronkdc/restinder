import React, { useState, useEffect } from "react";
import { supabase, onAuthStateChange } from "./lib/supabase";
import { AuthScreen } from "./components/AuthScreen";
import App from "./App";

export default function AppRoot() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = no auth

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (session === undefined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    );
  }

  // Not authenticated
  if (!session) {
    return <AuthScreen onAuth={(s) => setSession(s)} />;
  }

  // Authenticated — pass session to App
  return <App session={session} />;
}
