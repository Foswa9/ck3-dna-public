"use client";

import { useState } from "react";
import { useCharacters, type Character } from "@/context/CharactersContext";
import CharacterCard from "./CharacterCard";
import DNAModal from "./DNAModal";

interface CharacterGridProps {
  searchQuery: string;
  selectedType: "All" | "Historical" | "Community";
}

export default function CharacterGrid({ searchQuery, selectedType }: CharacterGridProps) {
  const { characters, loading, error } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );

  const filteredCharacters = characters.filter((char) => {
    const q = searchQuery.toLowerCase();
    const matchesName = char.name.toLowerCase().includes(q);
    const matchesTags = char.tags?.some((tag) =>
      tag.toLowerCase().includes(q)
    );
    const matchesSearch = matchesName || matchesTags;

    if (selectedType === "All") return matchesSearch;
    return matchesSearch && char.characterType === selectedType;
  });

  if (loading && characters.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500 text-sm">
        Could not load characters. {error.message}
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

      <DNAModal
        isOpen={selectedCharacter !== null}
        onClose={() => setSelectedCharacter(null)}
        dnaString={selectedCharacter?.dnaCode}
      />
    </>
  );
}
