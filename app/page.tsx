"use client";

import { useState } from "react";
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import FilterBar from "@/components/home/FilterBar";
import CharacterGrid from "@/components/home/CharacterGrid";
import Footer from "@/components/home/Footer";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col min-h-screen font-display">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Hero />
          <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <CharacterGrid searchQuery={searchQuery} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
