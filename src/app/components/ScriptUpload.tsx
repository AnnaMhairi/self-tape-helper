'use client';

import { useState } from 'react';
import DocumentParser from './DocumentParser';

interface Props {
  onScriptParsed: (script: Array<{character: string; text: string}>) => void;
}

export default function ScriptUpload({ onScriptParsed }: Props) {
  const [text, setText] = useState('');

  const handleDocumentParsed = (content: string) => {
    setText(content);
    parseScript(content);
  };

  const parseScript = (content: string) => {
    const lines = content.split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [character, ...text] = line.split(':');
        return {
          character: character.trim(),
          text: text.join(':').trim()
        };
      });
    onScriptParsed(lines);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#202124] text-lg font-medium mb-4">Upload Script</h2>
        <DocumentParser onParsedContent={handleDocumentParsed} />
      </div>
      
      <div>
        <h2 className="text-[#202124] text-lg font-medium mb-4">Or Paste Script</h2>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            parseScript(e.target.value);
          }}
          placeholder="Paste your script here..."
          className="w-full h-48 p-3 border rounded-md text-[#202124] placeholder-[#5f6368]
                   focus:border-[#1a73e8] focus:outline-none transition-colors
                   hover:border-[#1a73e8]"
        />
      </div>
    </div>
  );
}