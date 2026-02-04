"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import FullscreenImageModal from "./FullscreenImageModal";

interface ImageGalleryProps {
  mainImage: string;
  additionalImages: string[];
  position?: string;
  onAddImageClick?: () => void;
}

export default function ImageGallery({ mainImage, additionalImages, position, onAddImageClick }: ImageGalleryProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  return (
    <div className="lg:col-span-3 flex flex-col gap-4">
      {/* Hero Image */}
      <div 
        className="relative w-full aspect-[3/4] bg-background-light dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg group cursor-pointer"
        onClick={() => setFullscreenImage(mainImage)}
      >
        <div
          className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-500 group-hover:scale-105"
          style={{ 
            backgroundImage: `url("${mainImage}")`,
            backgroundPosition: position || "center"
          }}
        ></div>
        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
      </div>

      {/* Thumbnails Gallery */}
      <div className="grid grid-cols-4 gap-3">
        {additionalImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setFullscreenImage(img)}
            className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 relative transition-all group"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-opacity opacity-70 group-hover:opacity-100"
              style={{ backgroundImage: `url("${img}")` }}
            ></div>
          </button>
        ))}
        {/* Helper/Add placeholder */}
        <button 
          onClick={onAddImageClick}
          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all relative flex items-center justify-center bg-background-light dark:bg-surface-dark group"
        >
          <Plus className="size-6 text-text-sub-light dark:text-text-sub-dark group-hover:text-primary transition-colors" />
        </button>
      </div>
      <FullscreenImageModal
        isOpen={!!fullscreenImage}
        onClose={() => setFullscreenImage(null)}
        imageUrl={fullscreenImage}
      />
    </div>
  );
}
