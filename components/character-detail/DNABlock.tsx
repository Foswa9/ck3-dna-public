"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";

interface DNABlockProps {
  dna: string;
}

export default function DNABlock({ dna }: DNABlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dna);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-text-main-light dark:text-text-main-dark font-bold text-lg">
            Character DNA String
          </h3>
          <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
            Copy this code to import into character creator.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-all shadow-md shadow-primary/20 w-full sm:w-auto transform active:scale-95"
        >
          {copied ? (
            <CheckCircle className="size-5" />
          ) : (
            <Copy className="size-5 group-hover:animate-bounce" />
          )}
          <span>{copied ? "Copied!" : "Copy DNA"}</span>
        </button>
      </div>

      {/* DNA Code Block */}
      <div className="relative group/code">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-lg blur opacity-0 group-hover/code:opacity-100 transition duration-500"></div>
        <div className="relative w-full bg-[#111418] border border-[#283039] rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
          <code className="block font-mono text-sm text-[#e2e8f0] whitespace-pre-wrap break-all leading-relaxed">
            {dna}
          </code>
        </div>
      </div>
      
      {/* Toast Notification (Simulated visual state for copied action inside the component if needed, though button change handles feedback well) */}
      {copied && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#111418] border border-[#283039] text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle className="size-5 text-green-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Copied to clipboard!</span>
              <span className="text-xs text-[#9dabb9]">DNA string ready to paste.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
