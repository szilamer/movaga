"use client"

import React from 'react'

interface AboutUsSectionProps {
  title: string;
  content: string;
  useHtml: boolean;
}

export default function AboutUsSection({ title, content, useHtml }: AboutUsSectionProps) {
  return (
    <section className="w-full bg-white py-12 md:py-16 text-gray-800">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">{title}</h2>
        {useHtml ? (
          <div 
            className="prose prose-lg mx-auto text-gray-700 text-justify" 
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-lg md:text-xl text-gray-700 text-justify mx-auto">
            {content}
          </p>
        )}
      </div>
    </section>
  )
} 
