import Link from "next/link";
import { useState } from "react";
import { Eye, Copy, Check } from "lucide-react";

interface CharacterCardProps {
  id: string;
  name: string;
  game: string;
  image: string;
  imagePosition?: string;
  tag?: string;
  tagColor?: string;
  dna: string;
  onViewDNA: () => void;
}

export default function CharacterCard({
  id,
  name,
  game,
  image,
  imagePosition,
  tag,
  tagColor,
  dna,
  onViewDNA,
}: CharacterCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page if inside link (though button is separate usually)
    e.stopPropagation(); // Stop propagation just in case
    try {
      await navigator.clipboard.writeText(dna);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/5">
      <Link href={`/character/${id}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-500 group-hover:scale-105"
          style={{ 
            backgroundImage: `url('${image}')`,
            backgroundPosition: imagePosition || "center"
          }}
        ></div>
        {tag && (
          <div
            className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded font-medium shadow-sm ${
              tagColor || "bg-black/60 backdrop-blur-sm"
            }`}
          >
            {tag}
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex justify-between items-start">
          <Link href={`/character/${id}`} className="text-text-main-light dark:text-text-main-dark font-bold truncate hover:text-primary transition-colors cursor-pointer">
            {name}
          </Link>
        </div>
        <p className="text-xs font-medium text-primary mb-2">{game}</p>
        <div className="mt-auto pt-3 flex gap-2">
          <button
            onClick={onViewDNA}
            className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-sm font-medium py-2 px-3 rounded transition-all"
          >
            <Eye className="size-4" />
            View
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-text-main-light dark:text-text-main-dark hover:text-primary text-sm font-medium py-2 px-3 rounded transition-all"
            title="Copy DNA to Clipboard"
          >
            {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
