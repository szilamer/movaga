'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { ProductList } from '@/components/admin/ProductList';
import { type Product, type Category } from '@/types';

export default function AdminProductManagementPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Hiba a termékek betöltésekor:', error);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      redirect('/');
    }

    loadProducts();

    // Kategóriák betöltése
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Hiba a kategóriák betöltésekor:', error));
  }, [session, status]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Termékkezelés</h1>
      
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Új termék létrehozása</h2>
        <ProductForm categories={categories} />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Termékek kezelése</h2>
        <ProductList products={products} onProductDeleted={loadProducts} />
      </div>
    </div>
  );
} 
