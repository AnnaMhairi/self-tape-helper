'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import LineReader from './components/LineReader'
import { Mic, Trash2, Pencil } from 'lucide-react'

interface ScriptLine {
  character: string
  text: string
  audioUrl?: string
}

export default function HomePage() {
  const [script, setScript] = useState<ScriptLine[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [selectedRole, setSelectedRole] = useState('')
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showReader, setShowReader] = useState(false)
  const [showAnalyzer, setShowAnalyzer] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [pastedScript, setPastedScript] = useState('')
  const [step, setStep] = useState<'intro' | 'chooseInput' | 'recordScript' | 'pasteScript' | 'chooseAction'>('intro')
  const [typedMessage, setTypedMessage] = useState('')
  const [characterInput, setCharacterInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [liveTranscription, setLiveTranscription] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [requestCount, setRequestCount] = useState(0)
  const lastRequestTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (step === 'intro') {
      const fullMessage =
        'Hello, welcome to Alexander, your rehearsal tool for running lines and script analysis. How would you like to add your script?'
      let index = 0
      const interval = setInterval(() => {
        setTypedMessage(fullMessage.slice(0, index + 1))
        index++
        if (index === fullMessage.length) {
          clearInterval(interval)
          setTimeout(() => setStep('chooseInput'), 500)
        }
      }, 30)
      return () => clearInterval(interval)
    }
  }, [step])

  const handleVoiceLineRecording = () => {
    if (!characterInput) {
      alert('Please enter the character name before recording.')
      return
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim()
      setLiveTranscription(transcript)

      if (event.results[event.resultIndex].isFinal) {
        if (transcript) {
          setScript(prev => [...prev, { character: characterInput.trim(), text: transcript }])
          setConfirmationMessage(`✅ Line added for ${characterInput.trim()}`)
          setTimeout(() => setConfirmationMessage(''), 3000)
          setCharacterInput('')
        } else {
          setLiveTranscription('Transcription failed. Please try again.')
        }
        setIsRecording(false)
      }
    }

    recognition.onerror = () => {
      alert('Voice recognition failed. Please try again.')
      setIsRecording(false)
    }

    recognition.start()
    setIsRecording(true)
  }

  const handlePasteScript = () => {
    const lines = pastedScript.split('\n').map(line => {
      const [character, ...rest] = line.split(':')
      return {
        character: character.trim(),
        text: rest.join(':').trim(),
      }
    }).filter(line => line.character && line.text)

    setScript(lines)
    setCurrentLine(0)
    setStep('chooseAction')
  }

  const handleAnalyze = async () => {
    const now = Date.now()
    if (lastRequestTimeRef.current && now - lastRequestTimeRef.current < 10000) {
      alert('Please wait a few seconds before running another analysis.')
      return
    }

    if (requestCount >= 10) {
      alert('You’ve reached the maximum number of analyses for this session.')
      return
    }

    lastRequestTimeRef.current = now
    setRequestCount(prev => prev + 1)

    setLoading(true)
    setAnalysis(null)
    setShowAnalyzer(true)
    try {
      const res = await fetch('/api/scene-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: script.map(l => `${l.character}: ${l.text}`).join('\n') })
      })
      const data = await res.json()
      if (data.error) {
        setAnalysis('Error: ' + data.error)
      } else {
        setAnalysis(data.analysis)
      }
    } catch {
      setAnalysis('An unexpected error occurred.')
    }
    setLoading(false)
  }

  const updateLine = (index: number) => {
    const updatedCharacter = prompt('Update character name:', script[index].character)?.trim()
    const updatedText = prompt('Update line text:', script[index].text)?.trim()
    if (updatedCharacter && updatedText) {
      const updatedScript = [...script]
      updatedScript[index] = { ...updatedScript[index], character: updatedCharacter, text: updatedText }
      setScript(updatedScript)
    }
  }

  const deleteLine = (index: number) => {
    const confirmed = confirm('Are you sure you want to delete this line?')
    if (confirmed) {
      const updatedScript = [...script]
      updatedScript.splice(index, 1)
      setScript(updatedScript)
    }
  }

  const uniqueCharacters = Array.from(new Set(script.map(line => line.character)))

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto space-y-8 text-center bg-[#f7f7f8] text-gray-800">
      <header className="text-left">
        <h1 className="text-4xl font-semibold mb-2">Alexander</h1>
        <p className="text-base text-gray-600">Your rehearsal companion for running lines and scene analysis</p>
      </header>

      {step === 'intro' && <p className="text-lg text-muted-foreground h-20">{typedMessage}</p>}

      {step === 'chooseInput' && (
        <div className="space-y-4">
          <p className="text-lg">How would you like to add your script?</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setStep('recordScript')}><Mic className="mr-2 h-4 w-4" /> Record Lines</Button>
            <Button variant="outline" onClick={() => setStep('pasteScript')}>Paste Lines</Button>
          </div>
          <Button variant="link" className="text-sm" onClick={() => setShowExample(prev => !prev)}>
            {showExample ? 'Hide Formatting Tips' : 'Show Formatting Tips'}
          </Button>
          {showExample && (
            <pre className="bg-gray-100 text-sm p-4 rounded border text-left whitespace-pre-wrap max-w-xl mx-auto">
TOM: Did you see her?
JANE: Who?
TOM: The new girl in chem class.
JANE: Oh... yeah. She’s cool.
TOM: Cool? She’s amazing.
            </pre>
          )}
        </div>
      )}

      {step === 'recordScript' && (
        <Card className="text-left">
          <CardHeader>
            <CardTitle>Record a Line</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Character Name"
              className="w-full p-2 border rounded"
              value={characterInput}
              onChange={(e) => setCharacterInput(e.target.value)}
            />
            <Button onClick={handleVoiceLineRecording} disabled={isRecording}>
              {isRecording ? 'Recording...' : 'Start Recording'}
            </Button>
            {liveTranscription && (
              <div className="bg-gray-100 text-sm p-3 rounded border text-left text-black">
                {liveTranscription}
              </div>
            )}
            {confirmationMessage && <p className="text-green-600 text-sm">{confirmationMessage}</p>}
          </CardContent>
        </Card>
      )}

      {step === 'pasteScript' && (
        <Card className="text-left">
          <CardHeader>
            <CardTitle>Paste your script below</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="TOM: Hey\nJANE: Hi there\nTOM: How are you?"
              value={pastedScript}
              onChange={(e) => setPastedScript(e.target.value)}
              rows={6}
              className="text-black"
            />
            <Button onClick={handlePasteScript}>Submit Script</Button>
          </CardContent>
        </Card>
      )}

      {(step === 'recordScript' || step === 'pasteScript') && script.length > 0 && (
        <div className="space-y-4">
          <p className="text-lg">Your Current Script</p>
          <ul className="space-y-2 text-left">
            {script.map((line, index) => (
              <li key={index} className="border p-3 rounded flex justify-between items-center bg-white">
                <div>
                  <strong>{line.character}:</strong> {line.text}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => updateLine(index)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteLine(index)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setStep('chooseAction')}>Continue</Button>
          </div>
        </div>
      )}

      {step === 'chooseAction' && script.length > 0 && (
        <div className="space-y-4">
          <p className="text-lg">What would you like to do next?</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setShowReader(true)}>🎭 Run Lines</Button>
            <Button onClick={handleAnalyze} variant="outline">🧠 Analyze Scene</Button>
          </div>
        </div>
      )}

      {(showReader || showAnalyzer) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showReader && (
            <Card>
              <CardHeader>
                <CardTitle>🎭 Run Lines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <div className="max-w-md">
                  <label className="block text-sm mb-1 text-muted-foreground">
                    Select Your Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-2 border rounded-md hover:border-blue-500 focus:border-blue-500 focus:outline-none"
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
              </CardContent>
            </Card>
          )}

          {showAnalyzer && (
            <Card>
              <CardHeader>
                <CardTitle>🧠 Analyze Scene</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                {loading ? (
                  <p>Analyzing scene...</p>
                ) : (
                  analysis && (
                    <div className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap text-black border">
                      {analysis}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  )
}
