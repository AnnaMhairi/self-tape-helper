// src/app/scene-analysis/page.tsx
'use client'

import { useState } from 'react'
import { Textarea } from '../../components/ui/textarea'
import { Button } from '../../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'

export default function SceneAnalysisPage() {
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAnalysis(null)
  
    try {
      const res = await fetch('/api/scene-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      })
  
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setAnalysis(data.analysis)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars  
    } catch (err) {
      setError('Something went wrong.')
    }
  
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Scene Analysis</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Paste a scene or monologue below to generate an actor-focused breakdown
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Paste your script here..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={10}
              required
              className="text-black"
            />
            <Button type="submit" className="w-full" disabled={loading || !script.trim()}>
              {loading ? 'Analyzing...' : 'Analyze Scene'}
            </Button>
          </form>

          {analysis && (
            <div className="mt-6 p-4 bg-gray-100 rounded text-sm whitespace-pre-wrap text-black border">
              {analysis}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
