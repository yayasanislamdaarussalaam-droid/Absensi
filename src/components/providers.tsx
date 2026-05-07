"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export const NextAuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered"))
        .catch((err) => console.log("SW error", err));
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
};
