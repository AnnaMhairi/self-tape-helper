// src/app/api/scene-analysis/route.ts
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { script } = await req.json()

  if (!script || script.trim().length < 10) {
    return NextResponse.json({ error: 'Script is too short.' }, { status: 400 })
  }

  const prompt = `
You're an acting coach. Analyze the following scene for an actor:

---
${script}
---

Return a breakdown including:
- Character objectives
- Emotional arc
- Obstacles
- Tactics
- Subtext
- Suggestions for performance
  `

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a professional acting coach and script analyst.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    })

    const analysis = chat.choices[0].message.content

    return NextResponse.json({ analysis })
  } catch (err: any) {
    console.error('OpenAI error:', err)
    return NextResponse.json({ error: 'Failed to analyze scene.' }, { status: 500 })
  }
}
