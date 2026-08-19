// Google Gemini API utility — free tier: 15 RPM, 1M tokens/day
// Get your key: https://aistudio.google.com/apikey

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function getApiKey(): string | null {
  const key = process.env.GOOGLE_AI_API_KEY
  if (!key || key === 'your_google_ai_api_key_here') return null
  return key
}

export function isGeminiAvailable(): boolean {
  return !!getApiKey()
}

// Text-only chat completion
export async function geminiChat(params: {
  systemPrompt: string
  userMessage: string
  history?: Array<{ role: string; content: string }>
 model?: string
}): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const model = params.model || 'gemini-2.0-flash'
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`

  const contents: any[] = []

  // Add history
  if (params.history) {
    for (const msg of params.history.slice(-10)) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: params.userMessage }],
  })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Gemini] API error:', res.status, err)
      return null
    }

    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (err) {
    console.error('[Gemini] Request failed:', err)
    return null
  }
}

// Vision (image + text) chat completion
export async function geminiVision(params: {
  systemPrompt: string
  userMessage: string
  imageBase64: string
  imageMimeType: string
  model?: string
}): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const model = params.model || 'gemini-2.0-flash'
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        contents: [{
          role: 'user',
          parts: [
            { text: params.userMessage },
            {
              inlineData: {
                mimeType: params.imageMimeType,
                data: params.imageBase64,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Gemini Vision] API error:', res.status, err)
      return null
    }

    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (err) {
    console.error('[Gemini Vision] Request failed:', err)
    return null
  }
}
