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
import { Pencil, Trash2 } from "lucide-react";

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
  stats?: {
    views: number;
    copies: number;
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
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
              
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] mb-4 text-text-main-light dark:text-text-main-dark">
                {character.name}
              </h1>
              <p className="text-lg text-text-sub-light dark:text-text-sub-dark font-normal leading-relaxed max-w-2xl">
                {character.description}
              </p>
            </div>

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
            tags: character.tags,
          }}
          additionalImages={additionalImages}
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
