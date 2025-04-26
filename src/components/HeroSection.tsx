"use client"

import React from 'react'
import { motion } from 'framer-motion'

export default function HeroSection() {
  return (
    <section className="relative group overflow-hidden" style={{ perspective: 800 }}>
      {/* Háttérkép szürke szűrővel, hoverre eltűnik a szürke */}
      <div
        className="w-full h-[600px] bg-cover bg-center filter grayscale group-hover:filter-none transition-filter duration-1000"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Fekete átfedés */}
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-colors duration-1000" />
      {/* Szöveg és logó */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gold-500">
        <motion.h1
          initial={{ rotateX: 0 }}
          animate={{ rotateX: 3260 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="text-6xl font-extrabold mb-4"
          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
        >
          MOVAGA
        </motion.h1>
        <p className="text-2xl max-w-xl">Minőség és elegancia minden vásárlónak</p>
      </div>
    </section>
  )
} 
