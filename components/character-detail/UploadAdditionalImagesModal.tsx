"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface UploadAdditionalImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => Promise<void>;
}

export default function UploadAdditionalImagesModal({
  isOpen,
  onClose,
  onUpload,
}: UploadAdditionalImagesModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Create a reference to 'custom_characters/filename'
      const timestamp = Date.now();
      const storageRef = ref(storage, `custom_characters/${timestamp}_${file.name}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Pass the URL to parent to handle Firestore update
      await onUpload(downloadURL);
      
      onClose();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
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
              Add Additional Image
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
              className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                dragActive 
                  ? "border-primary bg-primary/10 scale-[1.02]" 
                  : "border-border-light dark:border-border-dark hover:border-primary/50 hover:bg-background-light dark:hover:bg-background-dark/50"
              }`}
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*"
                className="hidden"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="size-12 text-primary animate-spin relative z-10" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">
                    Uploading...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="size-16 rounded-full bg-surface-light dark:bg-surface-dark shadow-lg flex items-center justify-center mb-2 group">
                    <Upload className="size-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-1">
                      Drag & Drop image here
                    </p>
                    <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-4">
                      or click to browse
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                  >
                    Select File
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-center text-xs text-text-sub-light dark:text-text-sub-dark mt-6">
              Supported formats: JPG, PNG, GIF, WEBP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
