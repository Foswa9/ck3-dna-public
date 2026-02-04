import { useState } from "react";
import { X, Copy, CheckCircle } from "lucide-react";

interface DNAModalProps {
  isOpen: boolean;
  onClose: () => void;
  dnaString?: string;
}

export default function DNAModal({
  isOpen,
  onClose,
  dnaString = "",
}: DNAModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dnaString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] overflow-y-auto"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/75 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Centered Container */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-surface-light dark:bg-surface-dark text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-border-light dark:border-border-dark">
          {/* Header */}
          <div className="bg-primary px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3
                className="text-lg font-semibold leading-6 text-white"
                id="modal-title"
              >
                Character DNA
              </h3>
              <p className="mt-1 text-sm text-primary-100">
                Copy the code below to import this character.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md text-white hover:text-white/80 focus:outline-none"
              onClick={onClose}
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-6 sm:px-6 bg-background-light dark:bg-background-dark">
            <div className="relative rounded-md bg-[#111418] border border-[#283039] p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <code className="block text-sm text-[#e2e8f0] font-mono whitespace-pre-wrap break-all leading-relaxed">
                {dnaString}
              </code>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-2 text-sm font-medium text-text-main-light dark:text-text-main-dark hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex justify-center items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-w-[140px]"
              >
                {copied ? (
                  <>
                    <CheckCircle className="size-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
