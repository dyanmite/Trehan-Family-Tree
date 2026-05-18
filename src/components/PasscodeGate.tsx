"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const auth = localStorage.getItem("family_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPasscode = process.env.NEXT_PUBLIC_FAMILY_PASSCODE || "Trehan2026";
    if (passcode === correctPasscode) {
      localStorage.setItem("family_auth", "true");
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!isClient) return null;
  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card p-8 rounded-2xl shadow-sm border border-border w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Lock className="text-primary w-8 h-8" />
        </motion.div>
        <h1 className="text-3xl font-heading font-semibold mb-2">Welcome Home</h1>
        <p className="text-muted-foreground mb-8">
          Please enter the family passcode to access the Trehan Family Tree.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Passcode"
              className="w-full px-4 py-3 rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg bg-card"
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2 font-medium"
              >
                Incorrect passcode. Please try again.
              </motion.p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-[#8AA496] text-primary-foreground py-3 rounded-xl text-lg font-medium transition-colors shadow-sm"
          >
            Enter Family Tree
          </button>
        </form>
      </motion.div>
    </div>
  );
}
