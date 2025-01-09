'use client';

import { useState } from 'react';
import mammoth from 'mammoth';

interface Props {
  onParsedContent: (content: string) => void;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function DocumentParser({ onParsedContent }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugText, setDebugText] = useState<string>('');

  const formatScriptText = (text: string, fileType: string): string => {
    // If it's a txt file, check if it's already formatted
    if (fileType === 'text/plain') {
      // Check if the text appears to be already formatted (contains "CHARACTER: dialogue" pattern)
      const lines = text.split('\n');
      const hasFormattedLines = lines.some(line => {
        // Check for pattern: WORD: followed by text
        return /^[A-Z]+:.*$/m.test(line.trim());
      });

      if (hasFormattedLines) {
        return text; // Return the text as-is if it's already formatted
      }
    }

    // If not a txt file or not pre-formatted, process the text
    const lines = text.split('\n');
    let formattedScript: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;

      // Skip stage directions and scene headings
      if (line.startsWith('INT.') || 
          line.startsWith('EXT.') || 
          line.startsWith('(') || 
          line.includes('Sides by Breakdown') ||
          /^\d+\.$/.test(line)) {
        continue;
      }

      // If line is in all caps and isn't too long (likely a character name)
      if (line === line.toUpperCase() && line.length < 50) {
        // Look ahead for dialogue
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++; // Skip empty lines

        if (j < lines.length) {
          const dialogueLine = lines[j].trim();
          
          // Check if the next line is actually dialogue
          if (dialogueLine && 
              !dialogueLine.startsWith('(') && 
              !dialogueLine.startsWith('INT.') && 
              !dialogueLine.startsWith('EXT.') && 
              dialogueLine !== dialogueLine.toUpperCase() &&
              !dialogueLine.includes('Sides by Breakdown')) {
            
            const character = line.replace(/\([^)]*\)/g, '').trim();
            formattedScript.push(`${character}: ${dialogueLine}`);
            i = j;
          }
        }
      }
    }

    const result = formattedScript.join('\n');
    
    if (formattedScript.length === 0) {
      throw new Error('No valid script content found. Please check the file format.');
    }
    
    return result;
  };

  const parsePDF = async (file: File) => {
    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF.js library not loaded');
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: false,
        disableFontFace: true
      }).promise;
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join('\n');
        fullText += pageText + '\n';
      }

      console.log('PDF extracted text:', fullText);
      return fullText;
    } catch (err) {
      console.error('PDF parsing error:', err);
      throw new Error('Error parsing PDF');
    }
  };

  const parseDOCX = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) {
      console.error('DOCX parsing error:', err);
      throw new Error('Error parsing DOCX');
    }
  };

  const parseTXT = async (file: File) => {
    try {
      const text = await file.text();
      return text;
    } catch (err) {
      console.error('TXT parsing error:', err);
      throw new Error('Error parsing TXT file');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      let text = '';
      
      switch (file.type) {
        case 'application/pdf':
          text = await parsePDF(file);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          text = await parseDOCX(file);
          break;
        case 'text/plain':
          text = await parseTXT(file);
          break;
        default:
          throw new Error('Please upload a PDF, DOCX, or TXT file');
      }

      // Store raw text for debugging
      setDebugText(text);

      // Pass the file type to formatScriptText
      const formattedText = formatScriptText(text, file.type);
      
      if (!formattedText) {
        throw new Error('No valid script content found. Please check the file format.');
      }

      onParsedContent(formattedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        Supported formats: PDF, DOCX, TXT
      </div>
      
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      
      {loading && (
        <div className="flex items-center text-blue-600">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing document...
        </div>
      )}
      
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {debugText && (
        <details className="mt-4">
          <summary className="text-sm text-gray-600 cursor-pointer">
            Show extracted text (for debugging)
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs whitespace-pre-wrap">
            {debugText}
          </pre>
        </details>
      )}
    </div>
  );
}