"use client";

import { X, Check, Upload, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imagePath: string) => void;
  selectedImage: string | null;
  characterImages?: string[];
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedImage,
  characterImages,
}: ImagePickerModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      
      // Select the uploaded image and close modal
      onSelect(downloadURL);
      onClose();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto" role="dialog">
      <div
        className="fixed inset-0 bg-gray-900/80 transition-opacity backdrop-blur-md"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4 bg-background-light/50 dark:bg-background-dark/50">
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
              Select Character Portrait
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-text-sub-light dark:text-text-sub-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Grid */}
          <div className="p-6">
            <div className="mb-6 flex justify-end">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload New Image
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Character specific images */}
              {characterImages && characterImages.length > 0 ? (
                 characterImages.map((img, index) => (
                    <button
                      key={`char-img-${index}`}
                      onClick={() => {
                        onSelect(img);
                        onClose();
                      }}
                      className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === img
                          ? "border-primary ring-4 ring-primary/20"
                          : "border-transparent hover:border-primary/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Character Image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        selectedImage === img ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}>
                        {selectedImage === img ? (
                          <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                            <Check className="size-6" />
                          </div>
                        ) : (
                          <span className="text-white text-xs font-bold uppercase tracking-widest">Select</span>
                        )}
                      </div>
                    </button>
                  ))
              ) : (
                 <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-text-sub-light dark:text-text-sub-dark text-sm">
                       No images found for this character.
                       <br />
                       Upload a new image to select it.
                    </p>
                 </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-background-light/30 dark:bg-background-dark/30 border-t border-border-light dark:border-border-dark flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
