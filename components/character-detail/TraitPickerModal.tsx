"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface TraitItem {
  name: string;
  url: string;
}

interface TraitPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (traits: TraitItem[]) => void;
  alreadySelected?: TraitItem[];
}

export default function TraitPickerModal({
  isOpen,
  onClose,
  onConfirm,
  alreadySelected = [],
}: TraitPickerModalProps) {
  const [traits, setTraits] = useState<TraitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Track selected traits in order
  const [selected, setSelected] = useState<TraitItem[]>([]);

  // Initialize selected from alreadySelected when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected([...alreadySelected]);
    }
  }, [isOpen, alreadySelected]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTraits = async () => {
      try {
        setLoading(true);
        setError("");
        const traitsRef = ref(storage, "traits/");
        const result = await listAll(traitsRef);

        const traitItems: TraitItem[] = await Promise.all(
          result.items.map(async (item) => {
            const url = await getDownloadURL(item);
            // Remove file extension for display name
            const name = item.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            return { name, url };
          })
        );

        // Sort alphabetically
        traitItems.sort((a, b) => a.name.localeCompare(b.name));
        setTraits(traitItems);
      } catch (err: any) {
        console.error("Error fetching traits:", err);
        setError("Failed to load personality traits.");
      } finally {
        setLoading(false);
      }
    };

    fetchTraits();
  }, [isOpen]);

  if (!isOpen) return null;

  const getSelectionIndex = (url: string): number => {
    return selected.findIndex(s => s.url === url);
  };

  const handleToggle = (trait: TraitItem) => {
    const idx = getSelectionIndex(trait.url);
    if (idx >= 0) {
      // Deselect — remove from list
      setSelected(prev => prev.filter((_, i) => i !== idx));
    } else {
      // Select — append to end (preserves order)
      setSelected(prev => [...prev, trait]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto" role="dialog">
      <div
        className="fixed inset-0 bg-gray-900/80 transition-opacity backdrop-blur-md"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col transform rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4 bg-background-light/50 dark:bg-background-dark/50">
            <div>
              <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                Select Personality Traits
              </h3>
              <p className="text-xs text-text-sub-light dark:text-text-sub-dark mt-0.5">
                Tap traits in the order you want them displayed
                {selected.length > 0 && (
                  <span className="ml-2 text-primary font-bold">
                    • {selected.length} selected
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-text-sub-light dark:text-text-sub-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Grid - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
                  Loading traits...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : traits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
                  No traits found in storage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {traits.map((trait) => {
                  const selIdx = getSelectionIndex(trait.url);
                  const isSelected = selIdx >= 0;

                  return (
                    <button
                      key={trait.url}
                      type="button"
                      onClick={() => handleToggle(trait)}
                      className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? "bg-primary/10 ring-2 ring-primary shadow-md shadow-primary/10 -translate-y-0.5"
                          : "hover:bg-background-light dark:hover:bg-background-dark/50 hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-background-light dark:bg-background-dark/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={trait.url}
                          alt={trait.name}
                          className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="size-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg text-xs font-black">
                              {selIdx + 1}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center text-text-sub-light dark:text-text-sub-dark leading-tight line-clamp-2 capitalize">
                        {trait.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 bg-background-light/30 dark:bg-background-dark/30 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-full transition-all"
            >
              Clear All
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-[0.1em] text-white bg-primary hover:bg-primary-hover shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95"
              >
                <Check className="size-4" />
                Confirm ({selected.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
