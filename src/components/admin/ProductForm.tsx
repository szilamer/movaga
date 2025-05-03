'use client';

import { useState, useEffect, useRef } from 'react';
import { type Category, type DescriptionSection } from '@/types';
import { type ProductStatus } from '@prisma/client';
import Image from 'next/image';
import { toast } from 'sonner';
import { ProductDescriptionSections } from './ProductDescriptionSections';
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface FormData {
  name: string;
  description: string;
  descriptionSections?: DescriptionSection[];
  price: number;
  discountedPrice?: number;
  categoryId: string;
  stock: number;
  status: ProductStatus;
  sku?: string;
  metaTitle?: string;
  metaDescription?: string;
  images: string[];
}

interface ProductFormProps {
  categories: Category[];
  initialData?: any;
}

export const ProductForm = ({ categories, initialData }: ProductFormProps) => {
  // Parse descriptionSections if it's a string
  const [formData, setFormData] = useState<FormData>(() => {
    if (!initialData) {
      return {
        name: '',
        description: '',
        descriptionSections: [],
        price: 0,
        categoryId: categories[0]?.id || '',
        stock: 0,
        status: 'ACTIVE',
        images: [],
      };
    }

    // Handle description sections
    let parsedDescriptionSections: DescriptionSection[] = [];
    try {
      if (initialData.descriptionSections) {
        if (typeof initialData.descriptionSections === 'string') {
          parsedDescriptionSections = JSON.parse(initialData.descriptionSections);
        } else if (Array.isArray(initialData.descriptionSections)) {
          parsedDescriptionSections = initialData.descriptionSections;
        } else {
          // Try to coerce to the correct format if it's an object
          parsedDescriptionSections = [];
        }
      }
    } catch (error) {
      console.error('Error parsing descriptionSections:', error);
      parsedDescriptionSections = [];
    }

    return {
      ...initialData,
      descriptionSections: parsedDescriptionSections
    };
  });

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        const urls = res.map((file) => file.url);
        console.log("Upload complete:", urls);
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
        toast.success("Képek sikeresen feltöltve!");
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.error(`Hiba történt a feltöltés során: ${error.message}`);
    },
  });

  useEffect(() => {
    console.log('ProductForm mounted with initialData:', initialData);
    if (initialData && initialData.descriptionSections) {
      try {
        console.log('Original descriptionSections:', initialData.descriptionSections);
        console.log('Type:', typeof initialData.descriptionSections);
      } catch (error) {
        console.error('Error logging descriptionSections:', error);
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ellenőrizzük, hogy van-e kép feltöltve
      if (formData.images.length === 0) {
        toast.error('Legalább egy képet fel kell tölteni');
        setLoading(false);
        return;
      }

      const dataToSend = {
        ...formData,
        descriptionSections: formData.descriptionSections && formData.descriptionSections.length > 0 
          ? formData.descriptionSections 
          : null
      };

      console.log('Submitting data:', dataToSend);

      const response = await fetch(
        initialData?.id ? `/api/products/${initialData.id}` : '/api/products',
        {
          method: initialData?.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        
        if (response.status === 401) {
          toast.error('Nincs jogosultsága a művelethez');
        } else if (response.status === 403) {
          toast.error('Nincs megfelelő jogosultsága a művelethez');
        } else if (response.status === 400) {
          toast.error('Kérem töltse ki az összes kötelező mezőt');
        } else {
          toast.error(`Hiba történt a mentés során: ${response.status} ${errorText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Product saved:', data);
      toast.success('Termék sikeresen mentve!');

      // Sikeres mentés után töröljük az űrlapot
      if (!initialData?.id) {
        setFormData({
          name: '',
          description: '',
          descriptionSections: [],
          price: 0,
          categoryId: categories[0]?.id || '',
          stock: 0,
          status: 'ACTIVE',
          images: [],
        });
      }
    } catch (error) {
      console.error('Hiba:', error);
      toast.error('Hiba történt a mentés során');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    startUpload(files);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
    toast.success('Kép sikeresen törölve!');
  };

  const handleDescriptionSectionsChange = (sections: DescriptionSection[]) => {
    console.log('DescriptionSections updated:', sections);
    setFormData({ ...formData, descriptionSections: sections });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Képek *
        </label>
        <div className="mt-2 flex flex-wrap gap-4">
          {formData.images.map((image, index) => (
            <div key={`image-${index}-${new Date().getTime()}`} className="group relative h-32 w-32">
              <Image
                src={image}
                alt={`Termék kép ${index + 1}`}
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 128px) 100vw, 128px"
                unoptimized={true}
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all group-hover:bg-opacity-50">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="hidden rounded-full bg-red-500 p-2 text-white opacity-0 transition-all hover:bg-red-600 group-hover:block group-hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          <div className="flex flex-col items-start space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <Button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              {isUploading ? 'Feltöltés...' : 'Képek feltöltése'}
            </Button>
          </div>
          
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Terméknév *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Leírás *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <ProductDescriptionSections 
        sections={Array.isArray(formData.descriptionSections) ? formData.descriptionSections : []}
        onChange={handleDescriptionSectionsChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ár (Ft) *
          </label>
          <input
            type="number"
            required
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Akciós ár (Ft)
          </label>
          <input
            type="number"
            min="0"
            value={formData.discountedPrice || ''}
            onChange={(e) => setFormData({ ...formData, discountedPrice: Number(e.target.value) || undefined })}
            className="mt-1 block w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Kategória *
        </label>
        <select
          required
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="mt-1 block w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
        >
          <option value="">Válasszon kategóriát</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Készlet *
        </label>
        <input
          type="number"
          required
          min="0"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
          className="mt-1 block w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Státusz *
        </label>
        <select
          required
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
          className="mt-1 block w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
        >
          <option value="ACTIVE">Aktív</option>
          <option value="INACTIVE">Inaktív</option>
          <option value="DISCONTINUED">Kifutó</option>
        </select>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md bg-primary px-4 py-2 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {loading ? 'Mentés...' : 'Mentés'}
        </button>
      </div>
    </form>
  );
}; 
