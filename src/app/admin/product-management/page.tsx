'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { ProductList } from '@/components/admin/ProductList';
import { type Product, type Category } from '@/types';
import { toast } from 'sonner';

export default function AdminProductManagementPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Hiba a termékek betöltésekor');
      }
      const data = await res.json();
      setProducts(data.products || []);
      setError(null);
    } catch (error) {
      console.error('Hiba a termékek betöltésekor:', error);
      setError('Hiba történt a termékek betöltése során');
      toast.error('Hiba történt a termékek betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Hiba a kategóriák betöltésekor');
      }
      const data = await res.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Hiba a kategóriák betöltésekor:', error);
      toast.error('Hiba történt a kategóriák betöltése során');
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (session?.user?.role && ['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      loadProducts();
      loadCategories();
    } else if (status === 'authenticated') {
      redirect('/');
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Termékkezelés</h1>
      
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Új termék létrehozása</h2>
        <ProductForm categories={categories} key={`product-form-${categories.length}`} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
            onClick={loadProducts}
          >
            Újrapróbálkozás
          </button>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Termékek kezelése</h2>
          <ProductList products={products} onProductDeleted={loadProducts} key={`product-list-${products.length}`} />
        </div>
      )}
    </div>
  );
} 
