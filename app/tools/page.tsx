"use client";

import { useState } from "react";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { Copy, Trash2, Wand2, CheckCircle, AlertCircle } from "lucide-react";

export default function ToolsPage() {
  const [inputDNA, setInputDNA] = useState("");
  const [outputDNA, setOutputDNA] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Logic Ported from User's Script
  const processLineGeneric = (line: string) => {
    // Match any line with quotes and two values
    const regex =
      /^(\s*)([^=]+)=\{\s*"([^"]+)"\s+(\d+)\s+"([^"]+)"\s+(\d+)\s*\}(.*)$/;
    const match = line.match(regex);

    if (match) {
      const [, indent, attr, name1, value1, , , suffix] = match;
      // Replace second name and value with first name and value
      return `${indent}${attr}={ "${name1}" ${value1} "${name1}" ${value1} }${suffix}`;
    }

    return line;
  };

  const processJustValues = (line: string) => {
    // Match lines with just two numeric values like: attribute={ value1 value2 }
    const regex = /^(\s*)([^=]+)=\{\s*(\d+)\s+(\d+)\s*\}(.*)$/;
    const match = line.match(regex);

    if (match) {
      const [, indent, attr, value1, , suffix] = match;
      // Only unify if the attribute name suggests it's a duplicate property
      const attrName = attr.trim();
      if (
        attrName.includes("height") ||
        attrName.includes("width") ||
        attrName.includes("size") ||
        attrName.includes("body") ||
        attrName.includes("bust") ||
        attrName.includes("age")
      ) {
        return `${indent}${attr}={ ${value1} ${value1} }${suffix}`;
      }
    }

    return line;
  };

  const handleUnify = () => {
    if (!inputDNA.trim()) {
      setStatus({ type: "error", message: "Please paste DNA code first!" });
      return;
    }

    try {
      const lines = inputDNA.split("\n");
      const processedLines = lines.map((line) => {
        let processed = processLineGeneric(line);
        if (processed === line) {
          processed = processJustValues(line);
        }
        return processed;
      });

      const output = processedLines.join("\n");
      setOutputDNA(output);

      setStatus({
        type: "success",
        message: "✓ DNA successfully unified! All duplicate attributes now match.",
      });

      setTimeout(() => {
        setStatus({ type: null, message: "" });
      }, 5000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setStatus({ type: "error", message: "✗ Error processing DNA: " + msg });
    }
  };

  const handleCopy = async () => {
    if (!outputDNA) {
      setStatus({ type: "error", message: "Nothing to copy! Process DNA first." });
      return;
    }

    try {
      await navigator.clipboard.writeText(outputDNA);
      setStatus({ type: "success", message: "✓ Copied to clipboard!" });
      setTimeout(() => {
        setStatus({ type: null, message: "" });
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to copy." });
    }
  };

  const handleClear = () => {
    setInputDNA("");
    setOutputDNA("");
    setStatus({ type: null, message: "" });
  };

  return (
    <div className="flex flex-col min-h-screen font-display bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    CK3 DNA Unifier
                </h1>
                <p className="text-lg text-text-sub-light dark:text-text-sub-dark max-w-2xl mx-auto">
                    Overwrite your character DNA's recessive genes to be the same as the dominant genes.
                </p>
            </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
            <div className="p-6 sm:p-8 space-y-8">
              {/* Info Box */}
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r">
                <h3 className="text-primary font-bold mb-2">How to use:</h3>
                <ul className="list-disc pl-5 text-text-sub-light dark:text-text-sub-dark space-y-1 text-sm">
                  <li>Paste your CK3 Ruler Designer DNA code into the left box</li>
                  <li>Click "Unify DNA" to process</li>
                  <li>The unified DNA will appear on the right</li>
                  <li>Copy the new converted DNA</li>
                </ul>
              </div>

              {/* I/O Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-text-main-light dark:text-text-main-dark">
                    Input DNA
                  </label>
                  <textarea
                    value={inputDNA}
                    onChange={(e) => setInputDNA(e.target.value)}
                    placeholder="Paste your ruler_designer DNA here..."
                    className="w-full h-96 p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark font-mono text-xs sm:text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-text-main-light dark:text-text-main-dark">
                    Unified DNA
                  </label>
                  <textarea
                    value={outputDNA}
                    readOnly
                    placeholder="Unified DNA will appear here..."
                    className="w-full h-96 p-4 rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-[#111418] font-mono text-xs sm:text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-text-sub-light dark:text-text-sub-dark"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                  onClick={handleUnify}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover shadow-sm transition-colors"
                >
                  <Wand2 className="size-4" />
                  Unify DNA
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Copy className="size-4" />
                  Copy New DNA
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-6 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="size-4" />
                  Clear All
                </button>
              </div>

              {/* Status Message */}
              {status.type && (
                <div
                  className={`p-3 rounded-lg text-center font-medium text-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 ${
                    status.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {status.type === "success" ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
                  {status.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
