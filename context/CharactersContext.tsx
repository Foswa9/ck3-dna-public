"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Character {
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

interface CharactersContextType {
  characters: Character[];
  loading: boolean;
  error: Error | null;
}

const CharactersContext = createContext<CharactersContextType>({
  characters: [],
  loading: true,
  error: null,
});

export function useCharacters() {
  return useContext(CharactersContext);
}

export function CharactersProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, "characters"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setError(null);
        const chars = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            dnaCode: data.dnaCode,
            mainImage: data.mainImage,
            tags: data.tags || [],
            characterType: data.characterType,
            game: data.tags?.[0] || "Custom Character",
            ...data,
          };
        }) as Character[];
        setCharacters(chars);
        setLoading(false);
      },
      (err) => {
        console.error("Characters snapshot error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <CharactersContext.Provider value={{ characters, loading, error }}>
      {children}
    </CharactersContext.Provider>
  );
}
