'use client';

import { useState, useEffect } from 'react';
import { type DescriptionSection } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ProductDescriptionSectionsProps {
  sections: DescriptionSection[];
  onChange: (sections: DescriptionSection[]) => void;
}

export const ProductDescriptionSections = ({ 
  sections = [], 
  onChange 
}: ProductDescriptionSectionsProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState<DescriptionSection[]>([]);

  // Ensure sections is always a properly formatted array of DescriptionSection objects
  useEffect(() => {
    // Make sure sections is an array and has the right structure
    if (!Array.isArray(sections)) {
      console.warn('ProductDescriptionSections: sections is not an array', sections);
      setLocalSections([]);
      return;
    }

    // Validate that each item has the correct structure
    const validSections = sections.filter(section => 
      section && 
      typeof section === 'object' && 
      'id' in section && 
      'title' in section && 
      'content' in section
    );

    if (validSections.length !== sections.length) {
      console.warn('ProductDescriptionSections: some sections were filtered out due to invalid format', 
        sections, validSections);
    }

    setLocalSections(validSections);
  }, [sections]);

  const handleAddSection = () => {
    const newSection: DescriptionSection = {
      id: uuidv4(),
      title: '',
      content: ''
    };
    const updatedSections = [...localSections, newSection];
    setLocalSections(updatedSections);
    onChange(updatedSections);
    setExpanded(newSection.id);
  };

  const handleRemoveSection = (id: string) => {
    const updatedSections = localSections.filter(section => section.id !== id);
    setLocalSections(updatedSections);
    onChange(updatedSections);
    if (expanded === id) {
      setExpanded(null);
    }
  };

  const handleUpdateSection = (id: string, field: 'title' | 'content', value: string) => {
    const updatedSections = localSections.map(section => {
      if (section.id === id) {
        return { ...section, [field]: value };
      }
      return section;
    });
    setLocalSections(updatedSections);
    onChange(updatedSections);
  };

  const toggleSection = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Leírás szekciók
        </label>
        <Button 
          type="button" 
          onClick={handleAddSection}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Új szekció</span>
        </Button>
      </div>
      
      <div className="space-y-3 border rounded-md p-4">
        {localSections.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Nincs szekció hozzáadva. Kattintson az "Új szekció" gombra a hozzáadáshoz.
          </div>
        ) : (
          localSections.map((section) => (
            <div key={section.id} className="border rounded-md overflow-hidden">
              <div 
                className={`flex items-center justify-between p-3 bg-gray-50 cursor-pointer ${
                  expanded === section.id ? 'border-b' : ''
                }`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSection(section.id, 'title', e.target.value)}
                    placeholder="Szekció címe"
                    className="w-full border-0 bg-transparent focus:ring-0 p-0 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSection(section.id);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {expanded === section.id && (
                <div className="p-3">
                  <textarea
                    value={section.content}
                    onChange={(e) => handleUpdateSection(section.id, 'content', e.target.value)}
                    placeholder="Szekció tartalma..."
                    rows={4}
                    className="w-full rounded-md bg-background text-foreground border-border shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2 text-sm"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 