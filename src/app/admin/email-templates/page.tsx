'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EmailTemplateForm from '@/components/admin/email-templates/EmailTemplateForm';
import EmailTemplateList from '@/components/admin/email-templates/EmailTemplateList';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  triggerStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Hiba történt az adatok betöltése közben');
      }
      const data = await response.json();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
      toast.error('Hiba történt az email sablonok betöltése közben');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    fetchTemplates();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Email sablonok kezelése</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Új sablon létrehozása</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Új email sablon létrehozása</DialogTitle>
              <DialogDescription>
                Hozz létre egy új email sablont a rendelési folyamathoz.
              </DialogDescription>
            </DialogHeader>
            <EmailTemplateForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-800">
        <h2 className="mb-2 font-semibold">Információ a sablonokról</h2>
        <p className="text-sm">
          Az email sablonokban a következő változókat használhatod: {"{{orderNumber}}"}, {"{{total}}"}, {"{{shippingMethod}}"}, {"{{paymentMethod}}"}.
          Minden rendelési státuszhoz egy sablon tartozhat, amely automatikusan kiküldésre kerül, amikor a rendelés státusza megváltozik.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : (
        <EmailTemplateList templates={templates} onRefresh={fetchTemplates} />
      )}
    </div>
  );
} 