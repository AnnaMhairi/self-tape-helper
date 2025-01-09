'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Mic, MicOff } from 'lucide-react';

interface Line {
  character: string;
  text: string;
}

interface Props {
  script: Line[];
  userRole: string;
  currentLine: number;
  onNextLine: () => void;
}

interface Voice extends SpeechSynthesisVoice {
  localService: boolean;
  name: string;
  voiceURI: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function LineReader({ script, userRole, currentLine, onNextLine }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);
  const currentLineRef = useRef(currentLine);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1
  });
  
  const linesPerPage = 10;
  const totalPages = Math.ceil(script.length / linesPerPage);

  // Keep the ref updated with the latest currentLine value
  useEffect(() => {
    currentLineRef.current = currentLine;
  }, [currentLine]);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Set default to first English voice or first available voice
      const defaultVoice = availableVoices.find(voice => voice.lang.startsWith('en')) || availableVoices[0];
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const spokenText = event.results[0][0].transcript;
        const expectedLine = script[currentLineRef.current];
        
        console.log('Current line:', currentLineRef.current);
        console.log('Expected:', expectedLine.text);
        console.log('Got:', spokenText);
        
        const similarity = calculateSimilarity(spokenText.toLowerCase(), expectedLine.text.toLowerCase());
        
        if (similarity > 0.7) {
          setIsListening(false);
          onNextLine();
          
          // After user's line, automatically play the next AI line after a short delay
          setTimeout(async () => {
            const nextLineIndex = currentLineRef.current;
            if (nextLineIndex < script.length && script[nextLineIndex].character !== userRole) {
              await playLine(script[nextLineIndex].text);
              onNextLine();
            }
          }, 100);
        } else {
          console.log('Try again. Expected:', expectedLine.text, 'Got:', spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }

    // Auto-play first line if it's AI
    const firstLine = script[0];
    if (firstLine && firstLine.character !== userRole) {
      handleNextLine();
    }
  }, []);

  const calculateSimilarity = (a: string, b: string) => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitute = matrix[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
        matrix[j][i] = Math.min(
          substitute,
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1
        );
      }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return (maxLength - distance) / maxLength;
  };

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      if (script[currentLine].character === userRole) {
        recognition.start();
        setIsListening(true);
      } else {
        alert("It's not your line!");
      }
    }
  };

  const playLine = async (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    
    window.speechSynthesis.speak(utterance);
    
    return new Promise<void>(resolve => {
      utterance.onend = () => resolve();
    });
  };

  const handleNextLine = async () => {
    if (currentLine < script.length && !isPlaying) {
      const line = script[currentLine];
      
      if (line.character !== userRole) {
        setIsPlaying(true);
        await playLine(line.text);
        setIsPlaying(false);
        onNextLine();
      } else {
        // If it's user's line, just wait for speech recognition
        return;
      }
    }
  };

  const getCurrentPageLines = () => {
    const start = currentPage * linesPerPage;
    const end = start + linesPerPage;
    return script.slice(start, end);
  };

  useEffect(() => {
    // Auto-advance page if needed
    if (currentLine >= (currentPage + 1) * linesPerPage) {
      setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    }
  }, [currentLine]);

  return (
    <div className="space-y-6">
      {/* Voice Settings Panel */}
      <div className="bg-[#f8f9fa] rounded-lg p-4 border">
        <h3 className="text-[#202124] text-lg font-medium mb-4">Voice Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[#5f6368] text-sm mb-1">Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2 border rounded-md hover:border-[#1a73e8] 
                       focus:border-[#1a73e8] focus:outline-none transition-colors"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#5f6368] text-sm mb-1">Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => setVoiceSettings(prev => ({
                ...prev,
                rate: parseFloat(e.target.value)
              }))}
              className="w-full accent-[#1a73e8]"
            />
            <div className="flex justify-between text-xs text-[#5f6368] mt-1">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>
        </div>
      </div>

      {/* Script Display */}
      <div className="bg-white rounded-lg shadow-sm border p-4 min-h-[400px]">
        {getCurrentPageLines().map((line, index) => {
          const actualIndex = currentPage * linesPerPage + index;
          return (
            <div
              key={actualIndex}
              className={`p-3 rounded-lg transition-colors ${
                actualIndex === currentLine ? 'bg-[#e8f0fe]' : ''
              } ${
                line.character === userRole ? 'font-medium' : ''
              }`}
            >
              <span className="text-[#1a73e8]">{line.character}:</span>{' '}
              <span className="text-[#202124]">{line.text}</span>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-2 text-[#5f6368]">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            className="p-2 rounded-full hover:bg-[#f1f3f4] disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-full hover:bg-[#f1f3f4] disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {script[currentLine]?.character === userRole && (
            <button
              onClick={toggleListening}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Record Line
                </>
              )}
            </button>
          )}
          
          {script[currentLine]?.character !== userRole && (
            <button
              onClick={handleNextLine}
              disabled={currentLine >= script.length || isPlaying || isListening}
              className="px-6 py-2 bg-[#1a73e8] text-white rounded-lg disabled:opacity-50 
                       hover:bg-[#1557b0] transition-colors flex items-center gap-2 
                       flex-1 md:flex-initial justify-center"
            >
              {isPlaying ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Playing...
                </>
              ) : (
                'Next Line'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}