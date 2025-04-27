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
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error('Termék nem található');
        }
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error('Hiba a termék betöltésekor:', error);
        toast.error('A termék nem található vagy hiba történt a betöltés során');
        router.push('/admin/product-management');
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Hiba a kategóriák betöltésekor:', error);
        toast.error('Hiba történt a kategóriák betöltése során');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchCategories();
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