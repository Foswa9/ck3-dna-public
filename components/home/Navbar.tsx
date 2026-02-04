import { useState } from "react";
import Link from "next/link";
import { Fingerprint, Menu } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import CreateCharacterModal from "../create/CreateCharacterModal";

export default function Navbar() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark bg-opacity-95 dark:bg-opacity-95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center justify-center size-8 rounded bg-primary text-white">
                <Fingerprint className="size-5" />
              </div>
              <span className="text-text-main-light dark:text-text-main-dark text-lg font-bold tracking-tight hidden sm:block">
                Crusader Kings 3 DNA
              </span>
            </div>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-text-main-light dark:text-text-main-dark font-medium text-sm hover:text-primary dark:hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                href="/tools"
                className="text-text-sub-light dark:text-text-sub-dark font-medium text-sm hover:text-primary dark:hover:text-primary transition-colors"
              >
                Tools
              </Link>
              <Link
                href="#"
                className="text-text-sub-light dark:text-text-sub-dark font-medium text-sm hover:text-primary dark:hover:text-primary transition-colors"
              >
                Historical Characters
              </Link>
              <Link
                href="#"
                className="text-text-sub-light dark:text-text-sub-dark font-medium text-sm hover:text-primary dark:hover:text-primary transition-colors"
              >
                Custom Characters
              </Link>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="text-text-sub-light dark:text-text-sub-dark font-medium text-sm hover:text-primary dark:hover:text-primary transition-colors"
              >
                Add a Character
              </button>
            </nav>

            {/* Theme Toggle */}
            <div className="flex-1 flex justify-end gap-4 items-center">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                className="text-text-sub-light dark:text-text-sub-dark hover:text-primary"
              >
                <Menu className="size-6" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <CreateCharacterModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </>
  );
}
