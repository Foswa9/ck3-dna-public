import Link from "next/link";

const TAGS = ["Cyberpunk", "Stealth", "Male", "NPC"];

export default function TagCloud() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {TAGS.map((tag) => (
        <Link
          key={tag}
          href="#"
          className="px-3 py-1.5 rounded-full bg-background-light dark:bg-surface-dark hover:bg-primary/20 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary text-text-sub-light dark:text-text-sub-dark text-sm font-medium transition-colors"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
