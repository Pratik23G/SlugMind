import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500, headers: CORS_HEADERS }
    )
  }

  try {
    const { prompt, systemPrompt } = await request.json()

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt || 'You are a helpful assistant.' }] },
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      }),
    })

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      return NextResponse.json(
        { error: 'Gemini API error', details: data },
        { status: 502, headers: CORS_HEADERS }
      )
    }

    const text = data.candidates[0].content.parts[0].text

    return NextResponse.json({ text }, { status: 200, headers: CORS_HEADERS })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
