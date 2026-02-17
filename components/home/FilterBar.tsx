import { ArrowUpDown, Search } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: "All" | "Historical" | "Community";
  onTypeChange: (type: "All" | "Historical" | "Community") => void;
}

export default function FilterBar({ searchQuery, onSearchChange, selectedType, onTypeChange }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-border-light dark:border-border-dark">
      {/* Filters */}
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
        <span className="text-text-main-light dark:text-text-main-dark font-semibold text-sm mr-2 whitespace-nowrap">
          Filter by:
        </span>
        {(['All', 'Historical', 'Community'] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              if (selectedType === type) {
                onTypeChange("All");
              } else {
                onTypeChange(type);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === type
                ? "bg-primary text-white shadow-sm"
                : "bg-background-light dark:bg-surface-dark text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark border border-border-light dark:border-border-dark"
            }`}
          >
            {type === 'All' ? 'All Characters' : type}
          </button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-sub-light dark:text-text-sub-dark">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-surface-dark py-1.5 pl-9 pr-3 text-text-main-light dark:text-text-main-dark placeholder:text-text-sub-light dark:placeholder:text-text-sub-dark focus:ring-2 focus:ring-primary text-sm"
            placeholder="Search characters or tags..."
          />
        </div>

      </div>
    </div>
  );
}
