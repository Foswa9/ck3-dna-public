"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, CheckCircle, Image as ImageIcon, RotateCcw, Pencil } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ImagePickerModal from "./ImagePickerModal";

interface EditCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  initialData: {
    name: string;
    description: string;
    dnaCode: string;
    mainImage: {
      url: string;
      thumbnailUrl: string;
      position?: string;
    };
    tags: string[];
  };
  onUpdate: (updatedData: any) => void;
}

const AVAILABLE_TAGS = ["Female", "Male"];

export default function EditCharacterModal({
  isOpen,
  onClose,
  characterId,
  initialData,
  onUpdate,
}: EditCharacterModalProps) {
  const [formData, setFormData] = useState({ ...initialData });
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags || []);
  const [mainImageUrl, setMainImageUrl] = useState(initialData.mainImage?.url || "");
  const [imagePosition, setImagePosition] = useState(initialData.mainImage?.position || "50% 50%");
  
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Sync state if initialData changes
  useEffect(() => {
    setFormData({ ...initialData });
    setSelectedTags(initialData.tags || []);
    setMainImageUrl(initialData.mainImage?.url || "");
    setImagePosition(initialData.mainImage?.position || "50% 50%");
  }, [initialData]);

  if (!isOpen) return null;

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 4) return;
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Drag-to-pan logic
  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPanning(true);
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;

    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(100, ((clientX - container.left) / container.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - container.top) / container.height) * 100));

    setImagePosition(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name.trim()) throw new Error("Name is required.");
      if (!formData.dnaCode.trim()) throw new Error("DNA String is required.");

      const updatedData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dnaCode: formData.dnaCode.trim(),
        tags: selectedTags,
        mainImage: {
          url: mainImageUrl,
          thumbnailUrl: mainImageUrl,
          position: imagePosition,
        },
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(db, "characters", characterId);
      await updateDoc(docRef, updatedData);

      setSuccess(true);
      onUpdate({ ...initialData, ...updatedData });
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error("DEBUG: Error in handleSubmit:", err);
      setError(err instanceof Error ? err.message : "Failed to update character.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...initialData });
    setSelectedTags(initialData.tags || []);
    setMainImageUrl(initialData.mainImage?.url || "");
    setImagePosition(initialData.mainImage?.position || "50% 50%");
    setError("");
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog">
        <div
          className="fixed inset-0 bg-gray-900/75 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col transform rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-md z-10">
              <div>
                <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                  Edit Character
                </h2>
                <p className="text-xs text-text-sub-light dark:text-text-sub-dark mt-0.5">
                  Update character details and visuals
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-text-sub-light dark:text-text-sub-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:rotate-90"
              >
                <X className="size-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Body */}
              <div className="p-6 lg:p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Image Preview/Picker */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="space-y-4">
                      <div
                        onMouseDown={handlePanStart}
                        onMouseMove={handlePanMove}
                        onMouseUp={handlePanEnd}
                        onMouseLeave={handlePanEnd}
                        onTouchStart={handlePanStart}
                        onTouchMove={handlePanMove}
                        onTouchEnd={handlePanEnd}
                        className={`relative w-full aspect-[3/4] rounded-2xl border-2 transition-all duration-300 group shadow-lg overflow-hidden ${
                          isPanning ? "cursor-grabbing border-primary" : "cursor-grab border-transparent hover:border-primary/30"
                        }`}
                      >
                        {mainImageUrl ? (
                          <>
                            <div 
                              className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none transition-transform duration-500"
                              style={{ 
                                backgroundImage: `url("${mainImageUrl}")`,
                                backgroundPosition: imagePosition,
                                transform: isPanning ? 'scale(1.05)' : 'scale(1)'
                              }}
                            />
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors pointer-events-none" />
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsImagePickerOpen(true); }}
                                className="size-10 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                                title="Change Image"
                              >
                                <Pencil className="size-5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setImagePosition("50% 50%"); }}
                                className="size-10 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center text-text-sub-light dark:text-text-sub-dark shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                                title="Reset Framing"
                              >
                                <RotateCcw className="size-5" />
                              </button>
                            </div>
                            
                            <div className="absolute bottom-4 inset-x-4 pointer-events-none">
                              <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Interactive Framing</p>
                                <p className="text-xs font-medium">Drag anywhere on the image to adjust focus</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div 
                            onClick={() => setIsImagePickerOpen(true)}
                            className="flex flex-col items-center text-center p-6 text-text-sub-light dark:text-text-sub-dark w-full h-full justify-center bg-background-light dark:bg-background-dark/50 cursor-pointer"
                          >
                            <ImageIcon className="size-10 text-primary/70 mb-4" />
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-1">
                              Click to Select Image
                            </h3>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark px-1">
                        <span>X: {imagePosition.split(' ')[0]}</span>
                        <span>Y: {imagePosition.split(' ')[1]}</span>
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                      <p className="text-xs text-text-main-light dark:text-text-main-dark leading-relaxed">
                        <strong>Visual Precision:</strong> Drag the portrait to frame the character's face. This framing will be used in the gallery and list views.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Fields */}
                  <div className="lg:col-span-7 flex flex-col justify-start">
                    
                    {/* Tags */}
                    <div className="mb-6">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-4 block">
                        Select Categories
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                              selectedTags.includes(tag)
                                ? "bg-primary text-white shadow-md shadow-primary/30 -translate-y-0.5"
                                : "bg-background-light dark:bg-background-dark/50 text-text-sub-light dark:text-text-sub-dark border border-border-light dark:border-border-dark hover:border-primary hover:text-primary"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="mb-2">
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-transparent border-none p-0 text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] text-text-main-light dark:text-text-main-dark focus:ring-0 outline-none"
                        placeholder="Character Name *"
                      />
                      <div className="h-0.5 w-12 bg-primary mt-2 rounded-full"></div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full bg-transparent border-none p-0 text-lg text-text-sub-light dark:text-text-sub-dark font-normal leading-relaxed focus:ring-0 outline-none resize-none"
                        placeholder="Character description..."
                      />
                    </div>

                    {/* DNA */}
                    <div className="mb-8 group/dna">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-4 block">
                        DNA String *
                      </label>
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-xl blur opacity-0 group-focus-within/dna:opacity-100 transition duration-500"></div>
                        <textarea
                          required
                          value={formData.dnaCode}
                          onChange={(e) => setFormData({ ...formData, dnaCode: e.target.value })}
                          className="relative w-full bg-[#111418] border border-[#283039] rounded-xl p-6 font-mono text-xs sm:text-sm text-[#e2e8f0] focus:outline-none placeholder:text-[#4a5568] scrollbar-hide min-h-[200px]"
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                        <span className="size-5 rounded-full border-2 border-red-500 text-[10px] flex items-center justify-center font-bold">!</span>
                        {error}
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Sticky Footer - Fixed at bottom */}
              <div className="flex-shrink-0 p-4 border-t border-border-light dark:border-border-dark flex items-center justify-between bg-background-light/30 dark:bg-background-dark/30 backdrop-blur-md z-10">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-full transition-all active:scale-95"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </button>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className={`flex items-center gap-3 px-10 py-3 rounded-full text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95 ${
                      success
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-primary hover:bg-primary-hover hover:shadow-primary/20"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        Saving...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="size-5" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="size-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(path) => setMainImageUrl(path)}
        selectedImage={mainImageUrl}
      />
    </>
  );
}
