'use client';

import { useState, useEffect } from 'react';
import { ShippingMethod } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ShippingMethodFormProps = {
  initialData: ShippingMethod | null;
  onSubmit: (data: Partial<ShippingMethod>) => void;
  onCancel: () => void;
};

export default function ShippingMethodForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: ShippingMethodFormProps) {
  const [formData, setFormData] = useState<Partial<ShippingMethod>>({
    name: '',
    description: '',
    price: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    price?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        isActive: initialData.isActive,
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' ? parseFloat(value) : value,
    });

    // Töröljük a hibát, ha a felhasználó javítja
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isActive: checked,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      description?: string;
      price?: string;
    } = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'A szállítási mód neve kötelező';
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'A szállítási mód leírása kötelező';
    }

    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Az ár nem lehet negatív';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Név</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Pl. GLS futárszolgálat"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Leírás</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Pl. Házhozszállítás futárral 1-2 munkanapon belül"
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Ár (Ft)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          min="0"
          step="10"
          value={formData.price?.toString() || '0'}
          onChange={handleChange}
          placeholder="1490"
          className={errors.price ? 'border-red-500' : ''}
        />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive === undefined ? true : formData.isActive}
          onCheckedChange={handleSwitchChange}
        />
        <Label htmlFor="isActive">Aktív</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex items-center gap-1"
        >
          <XMarkIcon className="h-4 w-4" />
          Mégsem
        </Button>
        <Button 
          type="submit"
          className="flex items-center gap-1"
        >
          <PencilIcon className="h-4 w-4" />
          {initialData ? 'Mentés' : 'Létrehozás'}
        </Button>
      </div>
    </form>
  );
} 