"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CharacterCard from "./CharacterCard";
import DNAModal from "./DNAModal";

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
  game?: string; // Optional in our local type, mapped from tags or existing field
}

interface CharacterGridProps {
  searchQuery: string;
  selectedType: "All" | "Historical" | "Community";
}

export default function CharacterGrid({ searchQuery, selectedType }: CharacterGridProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "characters"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chars = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          dnaCode: data.dnaCode,
          mainImage: data.mainImage,
          tags: data.tags || [],
          characterType: data.characterType,
          // Map first tag to "game" prop for UI consistency, or default string
          game: data.tags?.[0] || "Custom Character", 
          ...data,
        };
      }) as Character[];
      setCharacters(chars);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCharacters = characters.filter((char) => {
    const query = searchQuery.toLowerCase();
    const matchesName = char.name.toLowerCase().includes(query);
    const matchesTags = char.tags?.some((tag) =>
      tag.toLowerCase().includes(query)
    );
    const matchesSearch = matchesName || matchesTags;

    if (selectedType === "All") return matchesSearch;
    return matchesSearch && char.characterType === selectedType;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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
            tag={char.tags?.[1]} // Use second tag as the visual tag overlay if available
            dna={char.dnaCode}
            onViewDNA={() => setSelectedCharacter(char)}
          />
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-20 text-text-sub-light dark:text-text-sub-dark">
          No characters found matching "{searchQuery}".
        </div>
      )}

      {/* Load More button (placeholder logic for now)
      {filteredCharacters.length > 0 && (
        <div className="mt-12 flex justify-center">
          <button className="px-8 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark">
            Load More Characters
          </button>
        </div>
      )} */}

      <DNAModal
        isOpen={selectedCharacter !== null}
        onClose={() => setSelectedCharacter(null)}
        dnaString={selectedCharacter?.dnaCode}
      />
    </>
  );
}
