"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface FullscreenImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export default function FullscreenImageModal({
  isOpen,
  onClose,
  imageUrl,
}: FullscreenImageModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all"
      >
        <X className="w-8 h-8" />
      </button>

      <div 
        className="relative w-full h-full flex items-center justify-center p-4 cursor-zoom-out"
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Fullscreen view"
          className="max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
    </div>
  );
}
