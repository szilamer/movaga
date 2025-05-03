'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { type Product, type Category } from '@/types';
import { toast } from 'sonner';

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      redirect('/');
    }

    const fetchProduct = async () => {
      try {
        console.log("Fetching product with ID:", id);
        const res = await fetch(`/api/products/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API error response:', errorText);
          throw new Error(`Termék nem található: ${res.status} ${errorText}`);
        }
        
        const data = await res.json();
        console.log("Loaded product data:", data);
        
        // Check if descriptionSections is a string and can be parsed
        if (data.descriptionSections && typeof data.descriptionSections === 'string') {
          try {
            console.log("Parsing descriptionSections from string");
            // Don't parse it here - let the ProductForm component handle this
          } catch (error) {
            console.error("Error parsing descriptionSections:", error);
            data.descriptionSections = [];
          }
        }
        
        setProduct(data);
      } catch (error) {
        console.error('Hiba a termék betöltésekor:', error);
        toast.error('A termék nem található vagy hiba történt a betöltés során');
        router.push('/admin/product-management');
      }
    };

    const fetchCategories = async () => {
      try {
        console.log("Fetching categories");
        const res = await fetch('/api/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API error response:', errorText);
          throw new Error(`Hiba a kategóriák betöltésekor: ${res.status} ${errorText}`);
        }
        
        const data = await res.json();
        console.log("Categories loaded:", data?.length || 0);
        setCategories(data);
      } catch (error) {
        console.error('Hiba a kategóriák betöltésekor:', error);
        toast.error('Hiba történt a kategóriák betöltése során');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchProduct();
      fetchCategories();
    }
  }, [id, router, session, status]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 bg-red-50 text-red-500 rounded-md">
          A termék nem található vagy hiba történt a betöltés során.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Termék szerkesztése</h1>
        <button
          onClick={() => router.push('/admin/product-management')}
          className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          Vissza
        </button>
      </div>
      
      <ProductForm 
        categories={categories} 
        initialData={product} 
      />
    </div>
  );
} 