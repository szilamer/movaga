import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

async function getTermsOfService() {
  try {
    const filePath = join(process.cwd(), 'public', 'uploads', 'homepage', 'aszf.md');
    const content = await readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading terms of service:', error);
    return null;
  }
}

export default async function ASZFPage() {
  const content = await getTermsOfService();

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div 
            className="prose prose-lg max-w-none legal-document" 
            style={{ color: '#374151' }}
          >
            <ReactMarkdown 
              components={{
                h1: ({children}) => <h1 style={{color: '#111827', fontWeight: '600'}}>{children}</h1>,
                h2: ({children}) => <h2 style={{color: '#111827', fontWeight: '600'}}>{children}</h2>,
                h3: ({children}) => <h3 style={{color: '#111827', fontWeight: '600'}}>{children}</h3>,
                h4: ({children}) => <h4 style={{color: '#111827', fontWeight: '600'}}>{children}</h4>,
                h5: ({children}) => <h5 style={{color: '#111827', fontWeight: '600'}}>{children}</h5>,
                h6: ({children}) => <h6 style={{color: '#111827', fontWeight: '600'}}>{children}</h6>,
                p: ({children}) => <p style={{color: '#374151'}}>{children}</p>,
                li: ({children}) => <li style={{color: '#374151'}}>{children}</li>,
                strong: ({children}) => <strong style={{color: '#111827', fontWeight: '700'}}>{children}</strong>,
                b: ({children}) => <b style={{color: '#111827', fontWeight: '700'}}>{children}</b>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a 
              href="/" 
              className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
            >
              ← Vissza a főoldalra
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Általános Szerződési Feltételek - Movaga',
  description: 'A Movaga általános szerződési feltételei és vásárlási feltételek.',
}; 