'use client';

import { useState, useEffect, useRef } from 'react';
import { type Category, type DescriptionSection } from '@/types';
import { type ProductStatus } from '@prisma/client';
import Image from 'next/image';
import { toast } from 'sonner';
import { ProductDescriptionSections } from './ProductDescriptionSections';
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
  pointValue?: number;
}

interface ProductFormProps {
  categories: Category[];
  initialData?: any;
}

export const ProductForm = ({ categories, initialData }: ProductFormProps) => {
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
        pointValue: 0,
      };
    }
    let parsedDescriptionSections: DescriptionSection[] = [];
    try {
      if (initialData.descriptionSections) {
        if (typeof initialData.descriptionSections === 'string') {
          parsedDescriptionSections = JSON.parse(initialData.descriptionSections);
        } else if (Array.isArray(initialData.descriptionSections)) {
          parsedDescriptionSections = initialData.descriptionSections;
        } else {
          parsedDescriptionSections = [];
        }
      }
    } catch (error) {
      console.error('Error parsing descriptionSections:', error);
      parsedDescriptionSections = [];
    }
    return {
      ...initialData,
      descriptionSections: parsedDescriptionSections,
      images: initialData.images || [],
      pointValue: initialData.pointValue ?? 0,
    };
  });

  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    console.log('ProductForm mounted with initialData:', initialData);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      const response = await fetch(
        initialData?.id ? `/api/products/${initialData.id}` : '/api/products',
        {
          method: initialData?.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) toast.error('Nincs jogosultsága a művelethez');
        else if (response.status === 403) toast.error('Nincs megfelelő jogosultsága a művelethez');
        else if (response.status === 400) toast.error('Kérem töltse ki az összes kötelező mezőt');
        else toast.error(`Hiba történt a mentés során: ${response.status} ${errorText}`);
        setLoading(false);
        return;
      }
      toast.success('Termék sikeresen mentve!');
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
          pointValue: 0,
        });
      }
    } catch (error) {
      console.error('Hiba:', error);
      toast.error('Hiba történt a mentés során');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesToUpload = Array.from(e.target.files);

    setUploadLoading(true);
    try {
      const formDataToSubmit = new FormData();
      filesToUpload.forEach((file) => {
        formDataToSubmit.append('files', file);
      });
      
      const response = await fetch('/api/upload', { 
        method: 'POST',
        body: formDataToSubmit,
      });
      
      if (!response.ok) {
        const errorText = await response.json().catch(() => ({ message: 'Képfeltöltési hiba' }));
        throw new Error(errorText.message || `Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
        setFormData((prev) => ({ 
          ...prev, 
          images: [...prev.images, ...result.urls]
        }));
        toast.success("Képek sikeresen feltöltve Cloudinary-ra!");
      } else {
        throw new Error('Nem érkeztek URL-ek a feltöltés után');
      }
    } catch (error: any) {
      console.error('Error uploading images to Cloudinary via /api/upload:', error);
      toast.error(error.message || 'Hiba történt a képek feltöltése során.');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDescriptionSectionsChange = (sections: DescriptionSection[]) => {
    setFormData(prev => ({ ...prev, descriptionSections: sections }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Termék neve
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Rövid leírás (meta)
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <ProductDescriptionSections 
        sections={formData.descriptionSections || []} 
        onChange={handleDescriptionSectionsChange} 
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Ár (Ft)
          </label>
          <input
            type="number"
            name="price"
            id="price"
            required
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label htmlFor="discountedPrice" className="block text-sm font-medium text-gray-700">
            Kedvezményes ár (Ft, opcionális)
          </label>
          <input
            type="number"
            name="discountedPrice"
            id="discountedPrice"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.discountedPrice || ''}
            onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div>
          <label htmlFor="pointValue" className="block text-sm font-medium text-gray-700">
            Pontérték
          </label>
          <input
            type="number"
            name="pointValue"
            id="pointValue"
            min="0"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.pointValue ?? 0}
            onChange={(e) => setFormData({ ...formData, pointValue: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Kategória
          </label>
          <select
            name="categoryId"
            id="categoryId"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Készlet (db)
          </label>
          <input
            type="number"
            name="stock"
            id="stock"
            required
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Státusz
          </label>
          <select
            name="status"
            id="status"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
          >
            <option value="ACTIVE">Aktív</option>
            <option value="INACTIVE">Inaktív</option>
            <option value="ARCHIVED">Archivált</option>
          </select>
        </div>
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            SKU (opcionális)
          </label>
          <input
            type="text"
            name="sku"
            id="sku"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.sku || ''}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
            Meta Cím (SEO, opcionális)
          </label>
          <input
            type="text"
            name="metaTitle"
            id="metaTitle"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.metaTitle || ''}
            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
            Meta Leírás (SEO, opcionális)
          </label>
          <textarea
            name="metaDescription"
            id="metaDescription"
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.metaDescription || ''}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Képek</label>
        <div className="mt-2 flex items-center">
          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
            <span>Képek feltöltése</span>
            <input 
              id="file-upload" 
              name="file-upload" 
              type="file" 
              multiple 
              className="sr-only" 
              onChange={handleImageUpload} 
              disabled={uploadLoading}
              ref={fileInputRef}
            />
          </label>
          {uploadLoading && <p className="ml-4 text-sm text-gray-500">Feltöltés folyamatban...</p>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {formData.images.map((image, index) => (
            <div key={index} className="relative group">
              <Image
                src={image}
                alt={`Termékkép ${index + 1}`}
                width={150}
                height={150}
                className="rounded-md object-cover aspect-square"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Kép eltávolítása"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || uploadLoading}>
          {loading ? 'Mentés...' : (initialData?.id ? 'Módosítások mentése' : 'Termék létrehozása')}
        </Button>
      </div>
    </form>
  );
}; 
