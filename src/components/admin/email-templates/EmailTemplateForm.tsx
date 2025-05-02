'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface EmailTemplateFormProps {
  initialData?: {
    id?: string;
    name: string;
    subject: string;
    content: string;
    triggerStatus: string;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

const ORDER_STATUSES = {
  PENDING: 'Függőben',
  PROCESSING: 'Feldolgozás alatt',
  SHIPPED: 'Kiszállítva',
  COMPLETED: 'Teljesítve',
  CANCELLED: 'Törölve',
};

export default function EmailTemplateForm({ initialData, onSuccess }: EmailTemplateFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: initialData || {
      name: '',
      subject: '',
      content: '',
      triggerStatus: 'PENDING',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const url = isEdit 
        ? `/api/admin/email-templates/${initialData?.id}` 
        : '/api/admin/email-templates';
      
      const method = isEdit ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Hiba történt a mentés során');
      }

      toast.success(`Email sablon sikeresen ${isEdit ? 'frissítve' : 'létrehozva'}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Hiba történt a mentés során');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setValue('isActive', checked);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Sablon neve</Label>
              <Input
                id="name"
                {...register('name', { required: 'A sablon neve kötelező' })}
                placeholder="Pl. Rendelés visszaigazolás"
                className="mt-1"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message?.toString()}</p>
              )}
            </div>

            <div>
              <Label htmlFor="triggerStatus">Küldési trigger (rendelés státusz)</Label>
              <select
                id="triggerStatus"
                {...register('triggerStatus', { required: 'A trigger státusz kötelező' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                disabled={isEdit}
              >
                {Object.entries(ORDER_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.triggerStatus && (
                <p className="text-red-500 text-sm mt-1">{errors.triggerStatus.message?.toString()}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Email tárgy</Label>
            <Input
              id="subject"
              {...register('subject', { required: 'Az email tárgya kötelező' })}
              placeholder="Pl. Rendelésed visszaigazolása ({{orderNumber}})"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Használhatsz változókat: {"{{orderNumber}}"}, {"{{total}}"}, {"{{shippingMethod}}"}, {"{{paymentMethod}}"}
            </p>
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject.message?.toString()}</p>
            )}
          </div>

          <div>
            <Label htmlFor="content">Email szövege (HTML)</Label>
            <Textarea
              id="content"
              {...register('content', { required: 'Az email tartalma kötelező' })}
              placeholder="<h1>Köszönjük a rendelésed!</h1><p>A rendelés azonosítója: {{orderNumber}}</p>"
              className="mt-1 font-mono h-64"
            />
            <p className="text-sm text-gray-500 mt-1">
              Használhatsz HTML formázást és változókat: {"{{orderNumber}}"}, {"{{total}}"}, {"{{shippingMethod}}"}, {"{{paymentMethod}}"}
            </p>
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message?.toString()}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive" 
              checked={isActive}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="isActive">Aktív</Label>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? 'Feldolgozás...' : isEdit ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
} 