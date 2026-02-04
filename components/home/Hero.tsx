"use client";

import { useState } from "react";
import { Plus, Loader2, CheckCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Sample data derived from existing characters
const SAMPLE_CHARACTERS = [
  {
    name: "Nova 7",
    game: "Cyber Sim 2077",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB1ibxg9AVSTRcFcxMSvobTcS9t75Hbt0V3tFjZkTxf6W71Zwg6qSVt7bVsKZeAshSF6oFn27Lc9k4BKh-tsk1BxdBhTIE6cfn4__S5JrE7_0Wfr8jWUedKgL-R9n0qKhRzXVe-RCJIltyWR6dEy_C_SQ7acKmDxD0drG8RIu0hY9gOwWoxNjba8YNgA1oLy_QG7Rep85u3wa2CTJa72U-m-Sqne5vLOPFeDUet0GvXx8tOhXtFyqh07ZAwf5NEiFNyzj2wpPAkBP0p",
    dna: "94000000000000000000000000000000000000000000000000000000000000000000000000000000",
    tags: ["Cyberpunk", "Female", "v1.2"],
  },
  {
    name: "Valerius",
    game: "Elden Chronicles",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDsrYm2qpMKyYReblpwrnfuZsowoDuSLhQLFkimxHW09UO9MvNf-2dbmRoKUqLcaQAfXQMZoUm_8a7W8WXvFdaB9Q1XimoyAJ-WqSQzES9E0DStjVL6Q18TsEmkkP7uoIspxZXMtsfIHaJa6duJaY7EcGfDQwP4ZInHBTmDheY7TQ8IrN8eENsvxtBmb67V1irvuwchfJ2J2TO-Ip3B2X-M9pK_X9OxqDg8NfL9mmy4sLgPbC-6a70py0JDJtUn5nrWCre9F2pznrJe",
    dna: "82000000000000000000000000000000000000000000000000000000000000000000000000000000",
    tags: ["Fantasy", "Male", "Noble"],
  },
  {
    name: "Elara Mist",
    game: "Fantasy RPG",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDMfcWST_bDIw33p_A6DZOhklbD76P6X0RgaFYmngXzBRWHs6j77lHv4abdbsewAxvOUIY2VFfYt8VFs7T7Ntl0D6EqT3Cnay0uhX0sbvDnaVwYVT1U1_bPmwNo3E0Xwbuy9y0zHPkqWjvLUAsvKTB6oFZkezHkh_V04zkUnwg29Pa2aPOwRnqKTwAYO6DgjijfaO1wjCTpLejsICmQ_EQvrZhIMb4YLxOPhp_I7q0PGDe7pQea4ZaNYxpSRxB4O4IFp5v4iSB1HUUE",
    dna: "71000000000000000000000000000000000000000000000000000000000000000000000000000000",
    tags: ["Fantasy", "Female", "Elf"],
  },
  {
    name: "Unit 734",
    game: "Cyber Sim 2077",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBC_8Z37QSOiD2IBApGNOyjfX0ON-B2hlp_w-C18DpsnfJRwMAc9cL8SDmcVMPhvjj6M3aAhkEZcKzeI0yWPZucRz7LpeEv_e14VlFd07AfCp1TtdgxVeCXjBpDxVeV21le0SuJYw0KZlCdjjQkaI1Pj24RVIbDGO9NZRR5dB4heFfD6EC61IvYiDGIqUhe6RLazAq4OQu4BfdvhURSpvL_cs2E1__lofvcK_hdhL8NmAKlW_3tDuM0G_yHqHgRcZLnqAC3Nr3EZBRH",
    dna: "7B 22 76 65 72 73 69 6F 6E 22 3A 31 2C 22 62 6F 64 79 22 3A 7B 22 74 79 70 65 22 3A 22 63 79 62 65 72 6E 65 74 69 63 22 2C 22 6D 6F 64 65 6C 22 3A 22 37 33 34 2D 58 22 7D 2C 22 73 6B 69 6E 22 3A 7B 22 74 6F 6E 22 3A 22 23 32 41 32 41 32 41 22 2C 22 72 6F 75 67 68 6E 65 73 73 22 3A 30 2E 34 7D 7D",
    tags: ["Cybernetic", "v2.4 Compatible", "Stealth", "NPC"],
  },
];

export default function Hero() {
  const [seeding, setSeeding] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const collectionRef = collection(db, "characters");
      
      for (const char of SAMPLE_CHARACTERS) {
        await addDoc(collectionRef, {
          name: char.name,
          dnaCode: char.dna,
          mainImage: {
            url: char.image,
            thumbnailUrl: char.image, // Using same URL for thumbnail for now
          },
          additionalImages: [
            {
              url: char.image,
              thumbnailUrl: char.image,
              caption: "Main Profile",
            }
          ],
          description: `A ${char.tags.join(", ")} character for ${char.game}.`,
          tags: char.tags,
          createdBy: "system_admin",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isPublic: true,
          stats: {
            views: Math.floor(Math.random() * 1000),
            copies: Math.floor(Math.random() * 500),
          },
        });
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error seeding characters:", error);
      alert("Failed to seed characters. check console or firebase config.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark sm:text-4xl mb-2">
          DNA Gallery
        </h1>

      </div>
      <p className="text-text-sub-light dark:text-text-sub-dark text-lg max-w-2xl">
        View characters with their DNA ready to be used
      </p>
    </div>
  );
}
