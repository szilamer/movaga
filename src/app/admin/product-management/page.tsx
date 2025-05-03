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

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (status === 'authenticated' && 
        (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string))) {
      redirect('/');
    }
    
    if (status === 'authenticated') {
      loadProducts();
      loadCategories();
    }
  }, [status, session]);

  const loadProducts = async () => {
    try {
      console.log("Termékek betöltése elkezdődött");
      setLoading(true);
      
      // Set headers and cache options explicitly
      const res = await fetch('/api/products?admin=true', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store' 
      });
      
      console.log("Termékek API válasz:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response:', errorText);
        throw new Error(`Hiba a termékek betöltésekor: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Termékek betöltve:", data.products?.length || 0);
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
      console.log("Kategóriák betöltése elkezdődött");
      const res = await fetch('/api/categories', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store' 
      });
      
      console.log("Kategóriák API válasz:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response:', errorText);
        throw new Error(`Hiba a kategóriák betöltésekor: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Kategóriák betöltve:", data?.length || 0);
      setCategories(data || []);
    } catch (error) {
      console.error('Hiba a kategóriák betöltésekor:', error);
      toast.error('Hiba történt a kategóriák betöltése során');
    }
  };

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
