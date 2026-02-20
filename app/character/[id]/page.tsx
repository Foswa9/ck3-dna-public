"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import Breadcrumbs from "@/components/character-detail/Breadcrumbs";
import ImageGallery from "@/components/character-detail/ImageGallery";
import DNABlock from "@/components/character-detail/DNABlock";
import MetadataGrid from "@/components/character-detail/MetadataGrid";
import TagCloud from "@/components/character-detail/TagCloud";
import EditCharacterModal from "@/components/character-detail/EditCharacterModal";
import DeleteCharacterModal from "@/components/character-detail/DeleteCharacterModal";
import UploadAdditionalImagesModal from "@/components/character-detail/UploadAdditionalImagesModal";
import { Pencil, Trash2, ExternalLink, Youtube, Book } from "lucide-react";

interface Character {
  name: string;
  dnaCode: string;
  mainImage: {
    url: string;
    thumbnailUrl: string;
    position?: string;
  };
  additionalImages?: (string | {
    url: string;
    thumbnailUrl: string;
    caption: string;
  })[];
  description: string;
  tags: string[];
  personalityTraits?: { name: string; url: string }[];
  stats?: {
    views: number;
    copies: number;
  };
  links?: {
    wikipedia?: string;
    grokepedia?: string;
    youtube?: string[];
  };
}

export default function CharacterDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCharacter = async () => {
      try {
        const docRef = doc(db, "characters", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCharacter(docSnap.data() as Character);
        } else {
          console.error("No such character!");
        }
      } catch (error) {
        console.error("Error fetching character:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "characters", id));
      router.push("/"); // Redirect to home after deletion
    } catch (error) {
      console.error("Error deleting character:", error);
      alert("Failed to delete character. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleAddImage = async (url: string) => {
    if (!id || !character) return;
    try {
      const docRef = doc(db, "characters", id);
      
      await updateDoc(docRef, {
        additionalImages: arrayUnion(url)
      });
      
      // Update local state
      setCharacter((prev) => prev ? {
        ...prev,
        additionalImages: [...(prev.additionalImages || []), url]
      } : null);
    } catch (error) {
      console.error("Error adding image:", error);
      alert("Failed to add image. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-text-sub-light dark:text-text-sub-dark text-lg">
            Character not found.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // Additional images array
  // Additional images array - handle both old object format and new string format
  const additionalImages = (character.additionalImages?.map((img) => {
    if (typeof img === 'string') return img;
    return img.url;
  }) || []).filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen font-display bg-background-light dark:bg-background-dark">
      <Navbar />
      <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-8 md:px-16 lg:px-40 w-full max-w-[1600px] mx-auto">
        <Breadcrumbs currentName={character.name} />

        <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Visuals */}
          <ImageGallery 
            mainImage={character.mainImage?.url} 
            additionalImages={additionalImages} 
            position={character.mainImage?.position}
            onAddImageClick={() => setIsUploadModalOpen(true)}
          />

          {/* Right Column: Details & Actions */}
          <div className="lg:col-span-9 flex flex-col justify-start pt-2 lg:pl-4">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col gap-4 mb-4">
                {/* External Links */}
                {(character.links?.wikipedia || character.links?.grokepedia || (character.links?.youtube && character.links.youtube.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {character.links.wikipedia && (
                      <a
                        href={character.links.wikipedia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/50 transition-all"
                      >
                        <Book className="size-3.5" />
                        Wikipedia
                      </a>
                    )}
                    {character.links.grokepedia && (
                      <a
                        href={character.links.grokepedia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
                      >
                        <ExternalLink className="size-3.5" />
                        Grokepedia
                      </a>
                    )}
                    {character.links.youtube?.map((url, index) => (
                      <a
                        key={`yt-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                      >
                        <Youtube className="size-3.5" />
                        YouTube
                        {character.links!.youtube!.length > 1 && <span className="opacity-70">#{index + 1}</span>}
                      </a>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {character.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          idx === 0
                            ? "bg-primary/20 text-primary"
                            : "bg-background-light dark:bg-surface-dark text-text-sub-light dark:text-text-sub-dark"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-sub-light dark:text-text-sub-dark hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                  >
                    <Pencil className="size-3.5" />
                    Edit Character
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
              
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] mb-4 text-text-main-light dark:text-text-main-dark">
                {character.name}
              </h1>
              <p className="text-lg text-text-sub-light dark:text-text-sub-dark font-normal leading-relaxed max-w-2xl">
                {character.description}
              </p>
            </div>

            {/* Personality Traits */}
            {character.personalityTraits && character.personalityTraits.length > 0 && (
              <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-sub-light dark:text-text-sub-dark mb-4 block">
                  Personality Traits
                </span>
                <div className="flex flex-wrap gap-4">
                  {character.personalityTraits.map((trait, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className="size-16 sm:size-20 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm overflow-hidden p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={trait.url}
                          alt={trait.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-sub-light dark:text-text-sub-dark capitalize">
                        {trait.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action */}
            <DNABlock dna={character.dnaCode} />

            {/* Tag Cloud */}
            {/* <TagCloud /> */}
          </div>
        </div>
      </main>
      <Footer />

      {isEditModalOpen && (
        <EditCharacterModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          characterId={id}
          initialData={{
            name: character.name,
            description: character.description,
            dnaCode: character.dnaCode,
            mainImage: character.mainImage,
            additionalImages: additionalImages,
            tags: character.tags,
            personalityTraits: character.personalityTraits,
            links: character.links,
          }}
          onUpdate={(updatedData) => setCharacter((prev) => prev ? { ...prev, ...updatedData } : null)}
        />
      )}
      
      <DeleteCharacterModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        characterName={character.name}
        isDeleting={isDeleting}
      />

      <UploadAdditionalImagesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleAddImage}
      />
    </div>
  );
}
