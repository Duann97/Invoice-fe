"use client";

import { ReactNode, useEffect } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 ">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#070B14] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="px-6 py-5 border-b border-white/10">
            {title ? (
              <h3 className="text-base font-semibold text-white">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-white/65">{description}</p>
            ) : null}
          </div>

          <div className="px-6 py-5">{children}</div>

          {footer ? (
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-2">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
