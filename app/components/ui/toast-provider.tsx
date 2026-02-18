"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast UI */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg
              ${
                t.type === "success"
                  ? "bg-emerald-500 text-white"
                  : t.type === "error"
                  ? "bg-red-500 text-white"
                  : "bg-gray-800 text-white"
              }
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
