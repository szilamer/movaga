"use client"

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface HeroSectionProps {
  backgroundImage: string;
  title: string;
  subtitle: string;
}

export default function HeroSection({ backgroundImage, title, subtitle }: HeroSectionProps) {
  return (
    <section 
      className="relative group overflow-hidden w-full"
      style={{ 
        perspective: 800, 
        height: '600px',
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Fekete átfedés */}
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-colors duration-1000" />
      
      {/* Szöveg és logó */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gold-500 p-4">
        <motion.div
          initial={{ rotateX: 0 }}
          animate={{ rotateX: 360 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-64 h-64 md:w-80 md:h-80 mb-4"
        >
          <Image
            src="/logo.png"
            alt={title}
            fill
            className="object-contain"
            priority
          />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 sr-only">{title}</h1>
        <p className="text-xl md:text-2xl max-w-xl text-shadow-md">{subtitle}</p>
      </div>
    </section>
  )
} 
