'use client';

import { useState } from 'react';
import ScriptUpload from './components/ScriptUpload';
import LineReader from './components/LineReader';

interface ScriptLine {
  character: string;
  text: string;
}

export default function Home() {
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');

  const handleScriptParsed = (parsedScript: ScriptLine[]) => {
    setScript(parsedScript);
    setCurrentLine(0);
  };

  const uniqueCharacters = Array.from(new Set(script.map(line => line.character)));

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-[#202124] text-2xl font-normal">Self-Tape Assistant</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <ScriptUpload onScriptParsed={handleScriptParsed} />
          </div>
          
          {script.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div className="max-w-md">
                  <label className="block text-[#5f6368] text-sm mb-1">
                    Select Your Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-2 border rounded-md hover:border-[#1a73e8] focus:border-[#1a73e8] 
                             focus:outline-none transition-colors"
                  >
                    <option value="">Choose your role...</option>
                    {uniqueCharacters.map(character => (
                      <option key={character} value={character}>
                        {character}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole && (
                  <LineReader
                    script={script}
                    userRole={selectedRole}
                    currentLine={currentLine}
                    onNextLine={() => setCurrentLine(prev => prev + 1)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}