"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface UploadAdditionalImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => Promise<void>;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function UploadAdditionalImagesModal({
  isOpen,
  onClose,
  onUpload,
}: UploadAdditionalImagesModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (fileList: FileList | File[]) => {
    const raw = Array.from(fileList);
    const images = raw.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      alert("Please add image files only.");
      return;
    }

    const valid: File[] = [];
    let skippedOversize = false;
    for (const f of images) {
      if (f.size > MAX_IMAGE_BYTES) {
        skippedOversize = true;
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) {
      alert("Each image must be under 5MB.");
      return;
    }
    if (skippedOversize && valid.length < images.length) {
      alert("Some files were skipped (over 5MB). Uploading the rest.");
    }

    try {
      setIsUploading(true);
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const storageRef = ref(
          storage,
          `custom_characters/${Date.now()}_${i}_${file.name.replace(/[^\w.-]/g, "_")}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await onUpload(downloadURL);
      }
      onClose();
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to upload image: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as Node | null;
    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.length) {
      void handleFiles(e.target.files);
    }
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto" role="dialog">
      <div
        className="fixed inset-0 bg-gray-900/80 transition-opacity backdrop-blur-md"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4 bg-background-light/50 dark:bg-background-dark/50">
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
              Add additional images
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-text-sub-light dark:text-text-sub-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-8">
            <div
              className={`relative flex flex-col items-center justify-center w-full min-h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                dragActive
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border-light dark:border-border-dark hover:border-primary/50 hover:bg-background-light dark:hover:bg-background-dark/50"
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={onDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*"
                multiple
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in py-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="size-12 text-primary animate-spin relative z-10" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">
                    Uploading...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center px-4 py-8">
                  <div className="size-16 rounded-full bg-surface-light dark:bg-surface-dark shadow-lg flex items-center justify-center mb-2 group">
                    <Upload className="size-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-1">
                      Drag &amp; drop images here
                    </p>
                    <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-4">
                      One or many — or click to browse
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                  >
                    Select files
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-text-sub-light dark:text-text-sub-dark mt-6">
              JPG, PNG, GIF, WEBP — max 5MB per image. Multiple files supported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
