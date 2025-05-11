"use client"

import React from 'react'

interface BusinessPartnersSectionProps {
  title: string;
  content: string;
  useHtml: boolean;
}

export default function BusinessPartnersSection({ title, content, useHtml }: BusinessPartnersSectionProps) {
  return (
    <section className="w-full bg-gray-900 py-12 md:py-16 text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gold-500">{title}</h2>
        {useHtml ? (
          <div 
            className="prose prose-lg prose-invert mx-auto text-gray-300 text-justify" 
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-lg md:text-xl text-gray-300 text-justify mx-auto">
            {content}
          </p>
        )}
      </div>
    </section>
  )
} 
