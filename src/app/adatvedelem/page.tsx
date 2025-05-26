import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

async function getPrivacyPolicy() {
  try {
    const filePath = join(process.cwd(), 'public', 'uploads', 'homepage', 'adatvedelem.md');
    const content = await readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading privacy policy:', error);
    return null;
  }
}

export default async function AdatvedelemPage() {
  const content = await getPrivacyPolicy();

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
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
  title: 'Adatvédelmi szabályzat - Movaga',
  description: 'A Movaga adatvédelmi szabályzata és személyes adatok kezelésére vonatkozó információk.',
}; 