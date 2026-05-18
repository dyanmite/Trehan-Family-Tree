"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import type { ToastMessage } from "@/types";

interface ToastContextType {
  addToast: (type: ToastMessage["type"], message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="pointer-events-auto bg-card border border-border rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 min-w-[300px] max-w-[420px]"
            >
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-primary flex-shrink-0" />}
              <p className="text-sm font-medium text-foreground flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
