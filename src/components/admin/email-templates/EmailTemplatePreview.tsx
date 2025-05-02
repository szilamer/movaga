'use client';

import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

interface EmailTemplatePreviewProps {
  template: {
    name: string;
    subject: string;
    content: string;
    triggerStatus: string;
  };
}

export default function EmailTemplatePreview({ template }: EmailTemplatePreviewProps) {
  const [open, setOpen] = useState(false);

  // Sample data for preview
  const previewData = {
    orderNumber: 'ORD12345',
    total: 25000,
    shippingMethod: 'GLS futárszolgálat',
    paymentMethod: 'Bankkártya',
  };

  // Replace placeholders in the template
  const replacePlaceholders = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = previewData[key as keyof typeof previewData];
      if (key === 'total' && typeof value === 'number') {
        return formatPrice(value);
      }
      return value !== undefined ? String(value) : match;
    });
  };

  const previewSubject = replacePlaceholders(template.subject);
  const previewContent = replacePlaceholders(template.content);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Előnézet</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email előnézet: {template.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-500">Email tárgy:</h3>
            <p className="text-base">{previewSubject}</p>
          </div>
          
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-500">Email tartalma:</h3>
            <div className="prose prose-sm max-w-none overflow-auto rounded-md bg-white p-4">
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Ez egy előnézet minta adatokkal. A valós email más adatokat fog tartalmazni.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 