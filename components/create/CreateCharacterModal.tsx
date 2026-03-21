"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, CheckCircle, Image as ImageIcon, RotateCcw, Youtube, Book, ExternalLink, Plus, Pencil } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_TAGS = ["Female", "Male"];
const CHARACTER_TYPES = ["Historical", "Community", "Personal"] as const;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type AdditionalImageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function makeAdditionalId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function CreateCharacterModal({
  isOpen,
  onClose,
}: CreateCharacterModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dnaCode: "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [characterType, setCharacterType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState("50% 50%");
  const [isPanning, setIsPanning] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  const [additionalImages, setAdditionalImages] = useState<AdditionalImageItem[]>([]);

  // External Links State
  const [wikipediaUrl, setWikipediaUrl] = useState("");
  const [grokepediaUrl, setGrokepediaUrl] = useState("");
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>([]);
  
  // Toggle states for link panels
  const [showWikipedia, setShowWikipedia] = useState(false);
  const [showGrokepedia, setShowGrokepedia] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingAdditional, setIsDraggingAdditional] = useState(false);

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPanning(true);
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;

    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(100, ((clientX - container.left) / container.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - container.top) / container.height) * 100));

    setImagePosition(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        if (file.size > MAX_IMAGE_BYTES) {
           setError("Image size must be less than 5MB");
           return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setImagePosition("50% 50%");
        };
        reader.readAsDataURL(file);
        setError("");
      } else {
        setError("Please upload an image file");
      }
    }
  };

  if (!isOpen) return null;

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      let newTags = [...selectedTags];
      
      // Enforce mutual exclusivity for Gender
      if (tag === "Male") {
        newTags = newTags.filter(t => t !== "Female");
      } else if (tag === "Female") {
        newTags = newTags.filter(t => t !== "Male");
      }

      if (newTags.length >= 4) return;
      setSelectedTags([...newTags, tag]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_BYTES) {
        setError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImagePosition("50% 50%");
      };
      reader.readAsDataURL(file);
      setError("");
    }
    e.target.value = "";
  };

  const addAdditionalImageFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const next: AdditionalImageItem[] = [];
    let oversize = false;
    let nonImage = false;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        nonImage = true;
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        oversize = true;
        continue;
      }
      next.push({
        id: makeAdditionalId(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (nonImage) setError("Only image files can be added.");
    else if (oversize) setError("Each image must be under 5MB.");
    else setError("");

    if (next.length > 0) {
      setAdditionalImages((prev) => [...prev, ...next]);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addAdditionalImageFiles(e.target.files);
    e.target.value = "";
  };

  const removeAdditionalImage = (id: string) => {
    setAdditionalImages((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleAdditionalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setIsDraggingAdditional(true);
  };

  const handleAdditionalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleAdditionalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as Node | null;
    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
    setIsDraggingAdditional(false);
  };

  const handleAdditionalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAdditional(false);
    if (e.dataTransfer.files?.length) addAdditionalImageFiles(e.dataTransfer.files);
  };

  const handleReset = () => {
    setFormData({ name: "", description: "", dnaCode: "" });
    setSelectedTags([]);
    setCharacterType("");
    setImageFile(null);
    setImagePreview(null);
    setImagePosition("50% 50%");
    setWikipediaUrl("");
    setGrokepediaUrl("");
    setYoutubeVideos([]);
    setShowWikipedia(false);
    setShowGrokepedia(false);
    setShowYoutube(false);
    setError("");
    additionalImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setAdditionalImages([]);
    setIsDraggingAdditional(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const hasCharacterType = (CHARACTER_TYPES as readonly string[]).includes(characterType);
    const hasGender =
      selectedTags.includes("Male") || selectedTags.includes("Female");

    if (!hasCharacterType || !hasGender) {
      const missing: string[] = [];
      if (!hasCharacterType) missing.push("character type");
      if (!hasGender) missing.push("gender");
      const msg =
        missing.length === 2
          ? "Please select a character type and gender before creating."
          : missing[0] === "character type"
            ? "Please select a character type before creating."
            : "Please select a gender (Male or Female) before creating.";
      setError(msg);
      return;
    }

    if (!formData.name.trim()) {
      setError("Character Name is required.");
      return;
    }
    if (!formData.dnaCode.trim()) {
      setError("DNA String is required.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Image
      let downloadURL = "https://placehold.co/600x800?text=No+Image";

      if (imageFile) {
        const storageRef = ref(storage, `custom_characters/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        downloadURL = await getDownloadURL(snapshot.ref);
      } else {
      }

      const additionalUrls: string[] = [];
      for (let i = 0; i < additionalImages.length; i++) {
        const { file } = additionalImages[i];
        const storageRef = ref(
          storage,
          `custom_characters/${Date.now()}_${i}_${file.name.replace(/[^\w.-]/g, "_")}`
        );
        const snapshot = await uploadBytes(storageRef, file);
        additionalUrls.push(await getDownloadURL(snapshot.ref));
      }

      // 2. Save Character Data with full schema
      const docData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dnaCode: formData.dnaCode.trim(),
        characterType: characterType,
        mainImage: {
          url: downloadURL,
          thumbnailUrl: downloadURL,
          position: imagePosition,
        },
        additionalImages: additionalUrls,
        tags: selectedTags,
        stats: {
          views: 0,
          copies: 0,
        },
        links: {
          wikipedia: wikipediaUrl.trim() || null,
          grokepedia: grokepediaUrl.trim() || null,
          youtube: youtubeVideos.filter(v => v.trim()),
        },
        createdBy: user?.email || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "characters"), docData);

      setSuccess(true);
      
      // Reset and close after a delay
      setTimeout(() => {
        setSuccess(false);
        handleReset();
        onClose();
      }, 1500);

    } catch (err: any) {
      // Better error messages for Firebase specific errors if possible
      let errorMessage = "Failed to create character. Please try again.";
      
      if (err.code === 'storage/unauthorized') {
        errorMessage = "Storage upload failed: Permission denied (Check Firebase Storage rules).";
      } else if (err.code === 'permission-denied') {
        errorMessage = "Firestore save failed: Permission denied (Check Firestore rules).";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog">
      <div
        className="fixed inset-0 bg-gray-900/75 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col transform rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark overflow-hidden">
          {/* Header - Fixed at top */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-md z-10">
            <div>
              <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                Add a new character
              </h2>
              <p className="text-[10px] text-text-sub-light dark:text-text-sub-dark mt-0.5">
                Add a new character to the DNA vault
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-text-sub-light dark:text-text-sub-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:rotate-90"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Body */}
            <div className="pt-5 pb-5 pl-3 pr-5 lg:pt-6 lg:pb-6 lg:pl-4 lg:pr-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-x-4 lg:gap-y-6">
                
                {/* Left Column: Visuals (Image Upload) */}
                <div className="lg:col-span-5 flex flex-col gap-4 min-w-0 lg:-ml-1">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-hidden
                  />

                  {imagePreview ? (
                    <>
                      <div className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg">
                        <p className="text-[11px] text-text-main-light dark:text-text-main-dark leading-relaxed">
                          <strong>Visual Precision:</strong> Drag the portrait to frame the character&apos;s face. This framing will be used in the gallery and list views.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div
                          onMouseDown={handlePanStart}
                          onMouseMove={handlePanMove}
                          onMouseUp={handlePanEnd}
                          onMouseLeave={handlePanEnd}
                          onTouchStart={handlePanStart}
                          onTouchMove={handlePanMove}
                          onTouchEnd={handlePanEnd}
                          className={`relative w-full max-w-[340px] mx-auto aspect-[3/4] rounded-2xl border-2 transition-all duration-300 group shadow-lg overflow-hidden ${
                            isPanning
                              ? "cursor-grabbing border-primary"
                              : "cursor-grab border-transparent hover:border-primary/30"
                          }`}
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none transition-transform duration-500"
                            style={{
                              backgroundImage: `url("${imagePreview}")`,
                              backgroundPosition: imagePosition,
                              transform: isPanning ? "scale(1.05)" : "scale(1)",
                            }}
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors pointer-events-none" />
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                imageInputRef.current?.click();
                              }}
                              className="size-9 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                              title="Change Image"
                            >
                              <Pencil className="size-[18px]" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImagePosition("50% 50%");
                              }}
                              className="size-9 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center text-text-sub-light dark:text-text-sub-dark shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                              title="Reset Framing"
                            >
                              <RotateCcw className="size-[18px]" />
                            </button>
                          </div>
                          <div className="absolute bottom-3 inset-x-3 pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md rounded-lg p-2.5 text-white">
                              <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">
                                Interactive Framing
                              </p>
                              <p className="text-[11px] font-medium leading-tight">
                                Drag anywhere on the image to adjust focus
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark px-1 max-w-[340px] mx-auto w-full">
                          <span>X: {imagePosition.split(" ")[0]}</span>
                          <span>Y: {imagePosition.split(" ")[1]}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative w-full max-w-[340px] mx-auto aspect-[3/4] rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 group shadow-lg ${
                        isDragging
                          ? "border-primary bg-primary/10 scale-[1.02]"
                          : "border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark/50 hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center text-center p-6 text-text-sub-light dark:text-text-sub-dark pointer-events-none">
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                          <ImageIcon className={`size-8 ${isDragging ? "text-primary animate-pulse" : "text-primary/70"}`} />
                        </div>
                        <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-1">
                          {isDragging ? "Drop to upload" : "Upload Character Image"}
                        </h3>
                        <p className="text-[13px] max-w-[200px] leading-snug">
                          Drag and drop or click to select your character portrait
                        </p>
                        <span className="mt-4 text-[9px] uppercase tracking-widest font-bold opacity-60">
                          JPG, PNG • Max 5MB
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="w-full max-w-[340px] mx-auto">
                    <input
                      ref={additionalImagesInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      className="hidden"
                      aria-hidden
                    />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-2">
                      Additional images
                    </p>
                    <div
                      onDragEnter={handleAdditionalDragEnter}
                      onDragOver={handleAdditionalDragOver}
                      onDragLeave={handleAdditionalDragLeave}
                      onDrop={handleAdditionalDrop}
                      className={`rounded-xl border-2 border-dashed p-3 transition-all duration-200 ${
                        isDraggingAdditional
                          ? "border-primary bg-primary/10 scale-[1.01]"
                          : "border-border-light dark:border-border-dark bg-background-light/40 dark:bg-background-dark/30"
                      }`}
                    >
                      <div className="grid grid-cols-4 gap-3">
                        {additionalImages.map((item) => (
                          <div
                            key={item.id}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-border-light dark:border-border-dark group/add pointer-events-none"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.previewUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(item.id)}
                              onDragOver={handleAdditionalDragOver}
                              onDrop={handleAdditionalDrop}
                              className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/add:opacity-100 transition-opacity hover:bg-red-600 pointer-events-auto"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => additionalImagesInputRef.current?.click()}
                          onDragOver={handleAdditionalDragOver}
                          onDrop={handleAdditionalDrop}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all relative flex items-center justify-center bg-background-light dark:bg-surface-dark group/add pointer-events-auto"
                          title="Add images (browse — multiple allowed)"
                        >
                          <Plus className="size-6 text-text-sub-light dark:text-text-sub-dark group-hover/add:text-primary transition-colors" />
                        </button>
                      </div>
                      <p
                        className={`pointer-events-none text-center text-[11px] font-medium mt-3 leading-snug transition-colors ${
                          isDraggingAdditional
                            ? "text-primary"
                            : "text-text-sub-light dark:text-text-sub-dark"
                        }`}
                      >
                        {isDraggingAdditional
                          ? "Drop images here"
                          : "Drag & drop one or many images here, or use +"}
                      </p>
                    </div>
                    <p className="text-[10px] text-text-sub-light dark:text-text-sub-dark mt-2 leading-snug">
                      Optional gallery shots. Max 5MB per image.
                    </p>
                  </div>
                </div>

                {/* Middle Column: Core fields & DNA */}
                <div className="lg:col-span-4 flex flex-col justify-start min-w-0">
                  
                  {/* Character Type Select */}
                  <div className="mb-5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-3 block">
                      Character Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CHARACTER_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setCharacterType(type)}
                          className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                            characterType === type
                              ? "bg-primary text-white shadow-md shadow-primary/30 -translate-y-0.5"
                              : "bg-background-light dark:bg-background-dark/50 text-text-sub-light dark:text-text-sub-dark border border-border-light dark:border-border-dark hover:border-primary hover:text-primary"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tag Multi-Select */}
                  <div className="mb-5">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-3 block">
                      Gender <span className="text-red-500">*</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
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

                  {/* Character Name Input */}
                  <div className="mb-6">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-text-main-light dark:text-text-main-dark placeholder:text-text-sub-light/20 dark:placeholder:text-text-sub-dark/20 focus:ring-0 outline-none"
                      placeholder="Character Name *"
                    />
                    <div className="h-0.5 w-10 bg-primary mt-1.5 rounded-full"></div>
                  </div>

                  {/* External Links & Media */}
                  <div className="mb-6">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-3 block">
                      External Links & Media
                    </label>
                    
                    {/* Link Toggle Buttons */}
                    <div className="flex flex-wrap gap-2.5 mb-4">
                      <button
                        type="button"
                        onClick={() => setShowWikipedia(!showWikipedia)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                          showWikipedia
                            ? "bg-primary/20 text-primary border border-primary/50"
                            : "bg-surface-light dark:bg-surface-dark text-text-sub-light dark:text-text-sub-dark border border-border-light dark:border-border-dark hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        <Book className="size-3.5" />
                        Wikipedia
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowGrokepedia(!showGrokepedia)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                          showGrokepedia
                            ? "bg-purple-500/20 text-purple-500 border border-purple-500/50"
                            : "bg-surface-light dark:bg-surface-dark text-text-sub-light dark:text-text-sub-dark border border-border-light dark:border-border-dark hover:border-purple-500/50 hover:text-purple-500"
                        }`}
                      >
                        <ExternalLink className="size-3.5" />
                        Grokepedia
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowYoutube(!showYoutube);
                          if (!showYoutube && youtubeVideos.length === 0) {
                            setYoutubeVideos([""]); // Start with one empty input
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                          showYoutube
                            ? "bg-red-500/20 text-red-500 border border-red-500/50"
                            : "bg-surface-light dark:bg-surface-dark text-text-sub-light dark:text-text-sub-dark border border-border-light dark:border-border-dark hover:border-red-500/50 hover:text-red-500"
                        }`}
                      >
                        <Youtube className="size-3.5" />
                        YouTube
                      </button>
                    </div>

                    {/* Link Input Fields */}
                    <div className="space-y-3">
                      {showWikipedia && (
                        <div className="relative group/link animate-in fade-in slide-in-from-top-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Book className="size-4 text-text-sub-light/50 dark:text-text-sub-dark/50 group-focus-within/link:text-primary transition-colors" />
                          </div>
                          <input
                            type="url"
                            value={wikipediaUrl}
                            onChange={(e) => setWikipediaUrl(e.target.value)}
                            placeholder="https://en.wikipedia.org/wiki/..."
                            className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl py-2.5 pl-10 pr-4 text-xs text-text-main-light dark:text-text-main-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-sub-light/30 dark:placeholder:text-text-sub-dark/30"
                          />
                        </div>
                      )}

                      {showGrokepedia && (
                        <div className="relative group/link animate-in fade-in slide-in-from-top-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ExternalLink className="size-4 text-text-sub-light/50 dark:text-text-sub-dark/50 group-focus-within/link:text-purple-500 transition-colors" />
                          </div>
                          <input
                            type="url"
                            value={grokepediaUrl}
                            onChange={(e) => setGrokepediaUrl(e.target.value)}
                            placeholder="https://grokepedia.com/wiki/..."
                            className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl py-2.5 pl-10 pr-4 text-xs text-text-main-light dark:text-text-main-dark focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-text-sub-light/30 dark:placeholder:text-text-sub-dark/30"
                          />
                        </div>
                      )}

                      {showYoutube && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 p-3 rounded-xl bg-surface-light/50 dark:bg-surface-dark/50 border border-border-light dark:border-border-dark">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-text-sub-light dark:text-text-sub-dark">YouTube Videos</span>
                            <button
                              type="button"
                              onClick={() => setYoutubeVideos([...youtubeVideos, ""])}
                              className="text-[9px] font-bold uppercase tracking-wider text-primary hover:text-primary-hover flex items-center gap-1"
                            >
                              <Plus className="size-3" /> Add Link
                            </button>
                          </div>
                          
                          {youtubeVideos.map((url, index) => (
                            <div key={index} className="flex items-center gap-2 group/yt relative">
                              <div className="relative flex-1 group/input">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Youtube className="size-4 text-text-sub-light/50 dark:text-text-sub-dark/50 group-focus-within/input:text-red-500 transition-colors" />
                                </div>
                                <input
                                  type="url"
                                  value={url}
                                  onChange={(e) => {
                                    const newVideos = [...youtubeVideos];
                                    newVideos[index] = e.target.value;
                                    setYoutubeVideos(newVideos);
                                  }}
                                  placeholder="https://youtube.com/watch?v=..."
                                  className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg py-2 pl-9 pr-4 text-xs text-text-main-light dark:text-text-main-dark focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-text-sub-light/30 dark:placeholder:text-text-sub-dark/30"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newVideos = youtubeVideos.filter((_, i) => i !== index);
                                  setYoutubeVideos(newVideos.length ? newVideos : [""]);
                                }}
                                className="p-2 rounded-lg text-text-sub-light/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Remove link"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DNA String Input - Styled like code block */}
                  <div className="mb-6 group/dna">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-3 block">
                      DNA String *
                    </label>
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-xl blur opacity-0 group-focus-within/dna:opacity-100 transition duration-500"></div>
                      <textarea
                        required
                        value={formData.dnaCode}
                        onChange={(e) => setFormData({ ...formData, dnaCode: e.target.value })}
                        className="relative w-full bg-[#111418] border border-[#283039] rounded-xl p-5 font-mono text-[10px] sm:text-xs text-[#e2e8f0] focus:outline-none transition-all placeholder:text-[#4a5568] scrollbar-hide min-h-[160px]"
                        placeholder="Paste the raw CK3 DNA string here..."
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                      <span className="flex items-center justify-center size-5 rounded-full border-2 border-red-500 text-[10px] font-bold">!</span>
                      {error}
                    </div>
                  )}

                </div>

                {/* Right column: Description */}
                <div className="lg:col-span-3 flex flex-col min-h-0 lg:sticky lg:top-4 lg:self-start">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-3 block">
                    Description
                  </label>
                  <div className="flex flex-col flex-1 rounded-xl border border-border-light dark:border-border-dark bg-background-light/60 dark:bg-background-dark/40 p-4 shadow-sm min-h-[220px] lg:min-h-[min(520px,calc(90vh-12rem))]">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full flex-1 min-h-[180px] lg:min-h-0 bg-transparent text-sm sm:text-base text-text-main-light dark:text-text-main-dark font-normal leading-relaxed placeholder:text-text-sub-light/45 dark:placeholder:text-text-sub-dark/45 focus:ring-0 outline-none resize-y"
                      placeholder="Backstory, roleplay notes, or how you use this character in CK3..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer - Fixed at bottom */}
            <div className="flex-shrink-0 p-3.5 border-t border-border-light dark:border-border-dark flex items-center justify-between bg-background-light/30 dark:bg-background-dark/30 backdrop-blur-md z-10">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-full transition-all active:scale-95"
              >
                <RotateCcw className="size-4" />
                Reset
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`flex items-center gap-2.5 px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95 ${
                    success
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-primary hover:bg-primary-hover hover:shadow-primary/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-[18px] animate-spin" />
                      Creating...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="size-[18px]" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Upload className="size-[18px]" />
                      Create Character
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
