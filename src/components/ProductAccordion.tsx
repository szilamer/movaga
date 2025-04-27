'use client';

import { type DescriptionSection } from '@/types';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

interface ProductAccordionProps {
  sections: DescriptionSection[];
}

export const ProductAccordion = ({ sections = [] }: ProductAccordionProps) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium">További információk</h3>
      <Accordion type="single" collapsible className="mt-3">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger>{section.title}</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                {section.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}; 