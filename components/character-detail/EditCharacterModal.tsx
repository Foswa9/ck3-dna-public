"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, CheckCircle, Image as ImageIcon, RotateCcw, Pencil, Plus, Link as LinkIcon, Youtube, Book, ExternalLink } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ImagePickerModal from "./ImagePickerModal";
import TraitPickerModal from "./TraitPickerModal";

interface TraitItem {
  name: string;
  url: string;
}

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
    additionalImages?: string[];
    personalityTraits?: TraitItem[];
    links?: {
      wikipedia?: string;
      grokepedia?: string;
      youtube?: string[];
    };
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
  
  // External Links State
  const [wikipediaUrl, setWikipediaUrl] = useState(initialData.links?.wikipedia || "");
  const [grokepediaUrl, setGrokepediaUrl] = useState(initialData.links?.grokepedia || "");
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>(initialData.links?.youtube || []);
  
  // Toggle states for link panels
  const [showWikipedia, setShowWikipedia] = useState(!!initialData.links?.wikipedia);
  const [showGrokepedia, setShowGrokepedia] = useState(!!initialData.links?.grokepedia);
  const [showYoutube, setShowYoutube] = useState(initialData.links?.youtube && initialData.links.youtube.length > 0);
  
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Personality Traits
  const [personalityTraits, setPersonalityTraits] = useState<TraitItem[]>(initialData.personalityTraits || []);
  const [isTraitPickerOpen, setIsTraitPickerOpen] = useState(false);

  
  // Sync state if initialData changes
  useEffect(() => {
    setFormData({ ...initialData });
    setSelectedTags(initialData.tags || []);
    setMainImageUrl(initialData.mainImage?.url || "");
    setImagePosition(initialData.mainImage?.position || "50% 50%");
    setPersonalityTraits(initialData.personalityTraits || []);
    
    setWikipediaUrl(initialData.links?.wikipedia || "");
    setGrokepediaUrl(initialData.links?.grokepedia || "");
    setYoutubeVideos(initialData.links?.youtube || []);
    
    setShowWikipedia(!!initialData.links?.wikipedia);
    setShowGrokepedia(!!initialData.links?.grokepedia);
    setShowYoutube(initialData.links?.youtube && initialData.links.youtube.length > 0);
  }, [initialData]);

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

      const savedTraits = personalityTraits;

      const updatedData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dnaCode: formData.dnaCode.trim(),
        tags: selectedTags,
        personalityTraits: savedTraits,
        links: {
          wikipedia: wikipediaUrl.trim() || null,
          grokepedia: grokepediaUrl.trim() || null,
          youtube: youtubeVideos.filter(v => v.trim()),
        },
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
    setPersonalityTraits(initialData.personalityTraits || []);
    setWikipediaUrl(initialData.links?.wikipedia || "");
    setGrokepediaUrl(initialData.links?.grokepedia || "");
    setYoutubeVideos(initialData.links?.youtube || []);
    setShowWikipedia(!!initialData.links?.wikipedia);
    setShowGrokepedia(!!initialData.links?.grokepedia);
    setShowYoutube(initialData.links?.youtube && initialData.links.youtube.length > 0);
    setError("");
  };

  const handleTraitsConfirm = (traits: TraitItem[]) => {
    setPersonalityTraits(traits);
  };

  const handleRemoveTrait = (index: number) => {
    setPersonalityTraits(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog">
        <div
          className="fixed inset-0 bg-gray-900/75 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col transform rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-3.5 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-md z-10">
              <div>
                <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                  Edit Character
                </h2>
                <p className="text-[10px] text-text-sub-light dark:text-text-sub-dark mt-0.5">
                  Update character details and visuals
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
              <div className="p-5 lg:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Image Preview/Picker */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg">
                      <p className="text-[11px] text-text-main-light dark:text-text-main-dark leading-relaxed">
                        <strong>Visual Precision:</strong> Drag the portrait to frame the character's face. This framing will be used in the gallery and list views.
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
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsImagePickerOpen(true); }}
                                className="size-9 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                                title="Change Image"
                              >
                                <Pencil className="size-[18px]" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setImagePosition("50% 50%"); }}
                                className="size-9 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center text-text-sub-light dark:text-text-sub-dark shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                                title="Reset Framing"
                              >
                                <RotateCcw className="size-[18px]" />
                              </button>
                            </div>
                            
                            <div className="absolute bottom-3 inset-x-3 pointer-events-none">
                              <div className="bg-black/60 backdrop-blur-md rounded-lg p-2.5 text-white">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Interactive Framing</p>
                                <p className="text-[11px] font-medium leading-tight">Drag anywhere on the image to adjust focus</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div 
                            onClick={() => setIsImagePickerOpen(true)}
                            className="flex flex-col items-center text-center p-6 text-text-sub-light dark:text-text-sub-dark w-full h-full justify-center bg-background-light dark:bg-background-dark/50 cursor-pointer"
                          >
                            <ImageIcon className="size-9 text-primary/70 mb-3" />
                            <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-1">
                              Click to Select Image
                            </h3>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark px-1 max-w-[340px] mx-auto w-full">
                        <span>X: {imagePosition.split(' ')[0]}</span>
                        <span>Y: {imagePosition.split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Fields */}
                  <div className="lg:col-span-7 flex flex-col justify-start">
                    
                    {/* Tags */}
                    <div className="mb-5">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-3 block">
                        Select Categories
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

                    {/* Name */}
                    <div className="mb-1">
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-transparent border-none p-0 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-text-main-light dark:text-text-main-dark focus:ring-0 outline-none"
                        placeholder="Character Name *"
                      />
                      <div className="h-0.5 w-10 bg-primary mt-1.5 rounded-full"></div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full bg-transparent border-none p-0 text-base text-text-sub-light dark:text-text-sub-dark font-normal leading-relaxed focus:ring-0 outline-none resize-none"
                        placeholder="Character description..."
                      />
                    </div>

                    {/* Personality Traits */}
                    <div className="mb-6">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-3 block">
                        Personality Traits
                      </label>
                      <div className="flex flex-wrap gap-2.5 items-start">
                        {personalityTraits.map((trait, index) => (
                          <div key={`${trait.url}-${index}`} className="relative group/trait">
                            <div className="size-16 sm:size-20 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-md overflow-hidden p-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={trait.url}
                                alt={trait.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {/* Trait name */}
                            <span className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-wider text-text-sub-light dark:text-text-sub-dark whitespace-nowrap capitalize">
                              {trait.name}
                            </span>
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveTrait(index); }}
                              className="absolute -top-1.5 -right-1.5 size-[18px] rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/trait:opacity-100 transition-opacity shadow-md hover:scale-110"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {/* Open Picker button */}
                        <button
                          type="button"
                          onClick={() => setIsTraitPickerOpen(true)}
                          className="size-16 sm:size-20 rounded-xl border-2 border-dashed border-border-light dark:border-border-dark flex flex-col items-center justify-center gap-1 text-text-sub-light/50 dark:text-text-sub-dark/50 hover:border-primary/50 hover:text-primary transition-all duration-200"
                        >
                          <Plus className="size-[18px]" />
                          <span className="text-[7px] font-bold uppercase tracking-widest">{personalityTraits.length > 0 ? 'Edit' : 'Add'}</span>
                        </button>
                      </div>
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

                    {/* DNA */}
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
                          className="relative w-full bg-[#111418] border border-[#283039] rounded-xl p-5 font-mono text-[10px] sm:text-xs text-[#e2e8f0] focus:outline-none placeholder:text-[#4a5568] scrollbar-hide min-h-[160px]"
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
                        Saving...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="size-[18px]" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="size-[18px]" />
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
        characterImages={Array.from(new Set([
          initialData.mainImage?.url,
          ...(initialData.additionalImages || [])
        ].filter(Boolean) as string[]))}
      />

      <TraitPickerModal
        isOpen={isTraitPickerOpen}
        onClose={() => setIsTraitPickerOpen(false)}
        onConfirm={handleTraitsConfirm}
        alreadySelected={personalityTraits}
      />
    </>
  );
}
