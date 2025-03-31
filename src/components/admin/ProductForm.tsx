'use client';

import { useState } from 'react';
import { type Category } from '@/types';
import { type ProductStatus } from '@prisma/client';
import Image from 'next/image';
import { toast } from 'sonner';

interface FormData {
  name: string;
  description: string;
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
  initialData?: FormData & { id?: string };
}

export const ProductForm = ({ categories, initialData }: ProductFormProps) => {
  const [formData, setFormData] = useState<FormData>(initialData || {
    name: '',
    description: '',
    price: 0,
    categoryId: categories[0]?.id || '',
    stock: 0,
    status: 'ACTIVE',
    images: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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

      const response = await fetch(
        initialData?.id ? `/api/products/${initialData.id}` : '/api/products',
        {
          method: initialData?.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            images: formData.images,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Nincs jogosultsága a művelethez');
        } else if (response.status === 403) {
          toast.error('Nincs megfelelő jogosultsága a művelethez');
        } else if (response.status === 400) {
          toast.error('Kérem töltse ki az összes kötelező mezőt');
        } else {
          toast.error('Hiba történt a mentés során');
        }
        return;
      }

      toast.success('Termék sikeresen mentve!');

      // Sikeres mentés után töröljük az űrlapot
      if (!initialData?.id) {
        setFormData({
          name: '',
          description: '',
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    try {
      setUploading(true);

      const uploadData = new FormData();
      Array.from(e.target.files).forEach((file) => {
        uploadData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error('Hiba a képfeltöltés során');
      }

      const data = await response.json();
      const newImages = [...formData.images, ...data.urls];
      setFormData((prev) => ({ ...prev, images: newImages }));
      toast.success('Képek sikeresen feltöltve!');
    } catch (error) {
      console.error('Hiba a képfeltöltés során:', error);
      toast.error('Hiba történt a képfeltöltés során');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
    toast.success('Kép sikeresen törölve!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Képek *
        </label>
        <div className="mt-2 flex flex-wrap gap-4">
          {formData.images.map((image, index) => (
            <div key={index} className="group relative h-32 w-32">
              <Image
                src={image}
                alt={`Termék kép ${index + 1}`}
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 128px) 100vw, 128px"
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
          <div className="relative flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            {uploading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <span className="mt-2 text-sm text-gray-500">Feltöltés...</span>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="image-upload"
                  className="flex cursor-pointer flex-col items-center justify-center text-sm text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span>Képek feltöltése</span>
                </label>
              </>
            )}
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {loading ? 'Mentés...' : 'Mentés'}
        </button>
      </div>
    </form>
  );
}; 