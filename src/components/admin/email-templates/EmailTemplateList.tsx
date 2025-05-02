'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EmailTemplateForm from './EmailTemplateForm';
import EmailTemplatePreview from './EmailTemplatePreview';

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

const ORDER_STATUSES = {
  PENDING: { label: 'Függőben', color: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'Feldolgozás alatt', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Kiszállítva', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Teljesítve', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Törölve', color: 'bg-red-100 text-red-800' },
};

export default function EmailTemplateList({ templates, onRefresh }: { templates: EmailTemplate[], onRefresh: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleActivationToggle = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !template.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Hiba történt a státusz módosítása során');
      }

      onRefresh();
      toast.success('Email sablon státusza sikeresen módosítva');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Hiba történt a státusz módosítása során');
    }
  };

  const handleEditClick = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card key={template.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{template.name}</h3>
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                  ORDER_STATUSES[template.triggerStatus as keyof typeof ORDER_STATUSES]?.color || 'bg-gray-100'
                }`}>
                  {ORDER_STATUSES[template.triggerStatus as keyof typeof ORDER_STATUSES]?.label || template.triggerStatus}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  id={`active-${template.id}`}
                  checked={template.isActive}
                  onCheckedChange={() => handleActivationToggle(template)}
                />
                <Label htmlFor={`active-${template.id}`} className="text-sm">
                  {template.isActive ? 'Aktív' : 'Inaktív'}
                </Label>
              </div>
              
              <EmailTemplatePreview template={template} />
              
              <Button variant="outline" size="sm" onClick={() => handleEditClick(template)}>
                Szerkesztés
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {templates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nincsenek email sablonok.</p>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Email sablon szerkesztése</DialogTitle>
            <DialogDescription>
              A változtatások azonnal életbe lépnek.
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <EmailTemplateForm 
              initialData={selectedTemplate}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 