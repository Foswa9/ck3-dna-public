"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import CharacterCard from "@/components/home/CharacterCard";
import DNAModal from "@/components/home/DNAModal";
import { Search } from "lucide-react";

interface Character {
  id: string;
  name: string;
  dnaCode: string;
  mainImage: {
    url: string;
    thumbnailUrl: string;
    position?: string;
  };
  tags: string[];
  characterType?: string;
  game?: string;
}

export default function HistoricalCharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "characters"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chars = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            dnaCode: data.dnaCode,
            mainImage: data.mainImage,
            tags: data.tags || [],
            characterType: data.characterType,
            game: data.tags?.[0] || "Custom Character",
            ...data,
          };
        })
        .filter((char) => char.characterType === "Historical") as Character[];
      setCharacters(chars);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCharacters = characters.filter((char) => {
    const q = searchQuery.toLowerCase();
    const matchesName = char.name.toLowerCase().includes(q);
    const matchesTags = char.tags?.some((tag) =>
      tag.toLowerCase().includes(q)
    );
    return matchesName || matchesTags;
  });

  return (
    <div className="flex flex-col min-h-screen font-display">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark">
              Historical Characters
            </h1>
            <p className="text-text-sub-light dark:text-text-sub-dark mt-2 text-sm">
              Browse historically accurate character presets
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-sub-light dark:text-text-sub-dark" />
            <input
              type="text"
              placeholder="Search historical characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark placeholder:text-text-sub-light/50 dark:placeholder:text-text-sub-dark/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    id={char.id}
                    name={char.name}
                    game={char.game || "Custom Character"}
                    image={char.mainImage?.url || ""}
                    imagePosition={char.mainImage?.position}
                    tag={char.tags?.[1]}
                    dna={char.dnaCode}
                    onViewDNA={() => setSelectedCharacter(char)}
                  />
                ))}
              </div>

              {filteredCharacters.length === 0 && (
                <div className="text-center py-20 text-text-sub-light dark:text-text-sub-dark">
                  {searchQuery
                    ? `No historical characters found matching "${searchQuery}".`
                    : "No historical characters available yet."}
                </div>
              )}
            </>
          )}

          <DNAModal
            isOpen={selectedCharacter !== null}
            onClose={() => setSelectedCharacter(null)}
            dnaString={selectedCharacter?.dnaCode}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
