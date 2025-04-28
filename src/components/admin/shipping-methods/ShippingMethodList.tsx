'use client';

import { useState, useEffect } from 'react';
import { ShippingMethod } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import ShippingMethodForm from './ShippingMethodForm';

export default function ShippingMethodList() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingShippingMethod, setEditingShippingMethod] = useState<ShippingMethod | null>(null);

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const fetchShippingMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/shipping-methods');
      
      if (!response.ok) {
        throw new Error('Hiba történt a szállítási módok betöltése során');
      }
      
      const data = await response.json();
      setShippingMethods(data);
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      setError(error instanceof Error ? error.message : 'Hiba történt a betöltés során');
      toast.error('Hiba történt a szállítási módok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a szállítási módot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shipping-methods/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Hiba történt a szállítási mód törlése során');
      }

      setShippingMethods(shippingMethods.filter(method => method.id !== id));
      toast.success('Szállítási mód sikeresen törölve!');
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      toast.error('Hiba történt a szállítási mód törlése során');
    }
  };

  const handleCreateOrUpdate = async (shippingMethod: Partial<ShippingMethod>) => {
    try {
      if (editingShippingMethod) {
        // Frissítés
        const response = await fetch(`/api/admin/shipping-methods/${editingShippingMethod.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shippingMethod),
        });

        if (!response.ok) {
          throw new Error('Hiba történt a szállítási mód frissítése során');
        }

        const updatedShippingMethod = await response.json();
        setShippingMethods(shippingMethods.map(m => m.id === updatedShippingMethod.id ? updatedShippingMethod : m));
        toast.success('Szállítási mód sikeresen frissítve!');
      } else {
        // Létrehozás
        const response = await fetch('/api/admin/shipping-methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shippingMethod),
        });

        if (!response.ok) {
          throw new Error('Hiba történt a szállítási mód létrehozása során');
        }

        const newShippingMethod = await response.json();
        setShippingMethods([...shippingMethods, newShippingMethod]);
        toast.success('Új szállítási mód sikeresen létrehozva!');
      }

      setShowForm(false);
      setEditingShippingMethod(null);
    } catch (error) {
      console.error('Error creating/updating shipping method:', error);
      toast.error(error instanceof Error ? error.message : 'Hiba történt a művelet során');
    }
  };

  const handleEdit = (shippingMethod: ShippingMethod) => {
    setEditingShippingMethod(shippingMethod);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingShippingMethod(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-center text-red-600">
        <p className="text-lg font-semibold">Hiba történt!</p>
        <p>{error}</p>
        <Button 
          onClick={fetchShippingMethods} 
          className="mt-4"
          variant="outline"
        >
          Újrapróbálkozás
        </Button>
      </div>
    );
  }

  return (
    <div>
      {showForm ? (
        <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            {editingShippingMethod ? 'Szállítási mód szerkesztése' : 'Új szállítási mód'}
          </h2>
          <ShippingMethodForm 
            initialData={editingShippingMethod}
            onSubmit={handleCreateOrUpdate}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="mb-6">
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Új szállítási mód
          </Button>
        </div>
      )}

      {shippingMethods.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">Még nincsenek szállítási módok. Hozz létre egyet!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Név</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Leírás</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ár</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Állapot</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {shippingMethods.map((method) => (
                <tr key={method.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{method.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{method.description}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatPrice(method.price)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {method.isActive ? 'Aktív' : 'Inaktív'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Button
                      onClick={() => handleEdit(method)}
                      variant="ghost"
                      size="icon"
                      className="mr-2 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="h-5 w-5" />
                      <span className="sr-only">Szerkesztés</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(method.id)}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                      <span className="sr-only">Törlés</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 