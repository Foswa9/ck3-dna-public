import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  currentName: string;
}

export default function Breadcrumbs({ currentName }: BreadcrumbsProps) {
  return (
    <div className="w-full max-w-[1200px] mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        <Link
          href="/"
          className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal hover:text-primary transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="size-4 text-text-sub-light dark:text-text-sub-dark" />
        <Link
          href="/"
          className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal hover:text-primary transition-colors"
        >
          Characters
        </Link>
        <ChevronRight className="size-4 text-text-sub-light dark:text-text-sub-dark" />
        <span className="text-text-main-light dark:text-text-main-dark text-sm font-medium leading-normal">
          {currentName}
        </span>
      </div>
    </div>
  );
}
