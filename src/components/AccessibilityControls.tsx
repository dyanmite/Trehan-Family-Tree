"use client";

import { useState, useEffect } from "react";
import { Settings, Contrast } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xlarge">("normal");

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedContrast = localStorage.getItem("a11y_contrast");
    const savedSize = localStorage.getItem("a11y_textSize");
    if (savedContrast === "true") setHighContrast(true);
    if (savedSize === "large" || savedSize === "xlarge") setTextSize(savedSize);
  }, []);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("a11y_contrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.remove("text-size-large", "text-size-xlarge");
    if (textSize === "large") {
      document.documentElement.classList.add("text-size-large");
    } else if (textSize === "xlarge") {
      document.documentElement.classList.add("text-size-xlarge");
    }
    localStorage.setItem("a11y_textSize", textSize);
  }, [textSize]);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-card p-3 rounded-full shadow-md border border-border text-primary hover:bg-muted transition-colors flex items-center justify-center group"
        aria-label="Accessibility Settings"
      >
        <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 left-0 bg-card p-4 rounded-2xl shadow-xl border border-border w-64 flex flex-col gap-4"
          >
            <h4 className="font-heading font-medium text-foreground border-b border-border pb-2">Accessibility</h4>
            
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Text Size</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTextSize("normal")}
                  className={`flex-1 py-1 text-sm rounded-lg border ${textSize === 'normal' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-transparent text-muted-foreground'}`}
                >
                  A
                </button>
                <button 
                  onClick={() => setTextSize("large")}
                  className={`flex-1 py-1 text-base rounded-lg border ${textSize === 'large' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-transparent text-muted-foreground'}`}
                >
                  A
                </button>
                <button 
                  onClick={() => setTextSize("xlarge")}
                  className={`flex-1 py-1 text-lg font-medium rounded-lg border ${textSize === 'xlarge' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-transparent text-muted-foreground'}`}
                >
                  A
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contrast</span>
              <button 
                onClick={() => setHighContrast(!highContrast)}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${highContrast ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-foreground hover:bg-border'}`}
              >
                <Contrast className="w-5 h-5" />
                <span className="text-sm font-medium">{highContrast ? 'High Contrast On' : 'Enable High Contrast'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
