"use client";

import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  characterName: string;
  isDeleting: boolean;
}

export default function DeleteCharacterModal({
  isOpen,
  onClose,
  onConfirm,
  characterName,
  isDeleting,
}: DeleteCharacterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog">
      <div
        className="fixed inset-0 bg-gray-900/80 transition-opacity backdrop-blur-md"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-2xl bg-surface-light dark:bg-surface-dark shadow-2xl transition-all border border-border-light dark:border-border-dark overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4 bg-background-light/50 dark:bg-background-dark/50">
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Delete Character
            </h3>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-full p-2 text-text-sub-light dark:text-text-sub-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-text-main-light dark:text-text-main-dark text-lg font-medium mb-2">
              Are you sure you want to delete <span className="font-bold text-primary">"{characterName}"</span>?
            </p>
            <p className="text-sm text-text-sub-light dark:text-text-sub-dark leading-relaxed">
              This action cannot be undone. The character and all its data will be permanently removed from the database.
            </p>
          </div>

          {/* Footer */}
          <div className="p-4 bg-background-light/30 dark:bg-background-dark/30 border-t border-border-light dark:border-border-dark flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-bold uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 text-white text-sm font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
