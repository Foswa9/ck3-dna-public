export default function MetadataGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-t border-border-light dark:border-border-dark">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-text-sub-light dark:text-text-sub-dark">
          File Size
        </span>
        <span className="text-text-main-light dark:text-text-main-dark font-semibold">
          24 KB
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-text-sub-light dark:text-text-sub-dark">
          Created
        </span>
        <span className="text-text-main-light dark:text-text-main-dark font-semibold">
          Oct 12, 2023
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-text-sub-light dark:text-text-sub-dark">
          Author
        </span>
        <span className="text-text-main-light dark:text-text-main-dark font-semibold">
          NexusLabs
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-text-sub-light dark:text-text-sub-dark">
          License
        </span>
        <span className="text-text-main-light dark:text-text-main-dark font-semibold">
          CC-BY-4.0
        </span>
      </div>
    </div>
  );
}
