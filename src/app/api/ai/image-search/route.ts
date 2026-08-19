import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { geminiVision, isGeminiAvailable } from '@/lib/gemini'

// ─── Simple keyword extraction from filename (fallback) ───────────────

function extractKeywordsFromFilename(filename: string): string[] {
  const name = filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').toLowerCase()
  const stopwords = new Set(['img', 'image', 'photo', 'pic', 'picture', 'download', 'upload', 'screenshot', 'pasted', 'file', 'jpeg', 'jpg', 'png', 'webp', 'final', 'copy', 'untitled'])
  return name.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w))
}

function matchProductsByKeywords(keywords: string[], allProducts: any[]): any[] {
  if (keywords.length === 0) return []
  const scored = allProducts.map(p => {
    let score = 0
    const searchables = `${p.name} ${p.category} ${p.subcategory || ''} ${p.tags} ${p.description}`.toLowerCase()
    for (const kw of keywords) {
      if (p.name.toLowerCase().includes(kw)) score += 10
      if (p.category.toLowerCase().includes(kw)) score += 8
      if ((p.subcategory || '').toLowerCase().includes(kw)) score += 7
      if (p.tags.toLowerCase().includes(kw)) score += 4
      if (p.description.toLowerCase().includes(kw)) score += 2
    }
    return { product: p, score }
  })
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid image type. Use JPEG, PNG, WebP, or GIF' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    const allProducts = await db.product.findMany({
      where: { isActive: true, stockQuantity: { gt: 0 } },
      include: { seller: { select: { id: true, name: true, avatar: true } } },
    })

    if (allProducts.length === 0) {
      return NextResponse.json({ results: [], analysis: 'No products available in the store' })
    }

    const productCatalog = allProducts.map(p => ({
      id: p.id, name: p.name, category: p.category, subcategory: p.subcategory,
      tags: p.tags, price: p.price, discountPrice: p.discountPrice,
      rating: p.rating, description: p.description.slice(0, 100), imageUrl: p.imageUrl,
    }))

    // Try Gemini Vision AI
    if (isGeminiAvailable()) {
      try {
        const systemPrompt = `You are an AI visual product recognition engine for NEXUS e-commerce.
Analyze the uploaded image and find similar products from the catalog.

You MUST respond with ONLY valid JSON: { "analysis": "description of what you see", "identifiedCategory": "main category", "identifiedTags": ["tag1", "tag2"], "colorScheme": ["color1"], "style": "modern/classic/etc", "matches": [{ "productId": "id", "matchReason": "why it matches", "matchScore": 0.0-1.0 }] }

Rules:
- Identify the main object/product in the image
- Extract visual attributes: category, style, colors, material hints
- Match against catalog considering: category, tags, style, price
- Return top 8 matches sorted by relevance
- matchScore: 0.9+ very similar, 0.7-0.9 similar style, 0.5-0.7 loosely related
- Be generous with matches to give options`

        const userPrompt = `Analyze this image and find similar products from this catalog:
${JSON.stringify(productCatalog, null, 2)}`

        const aiText = await geminiVision({
          systemPrompt,
          userMessage: userPrompt,
          imageBase64: base64,
          imageMimeType: mimeType,
        })

        if (aiText) {
          const jsonMatch = aiText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            const matches = (parsed.matches || []).slice(0, 8)
            const matchedIds = matches.map((m: any) => m.productId).filter((id: string) => allProducts.some(p => p.id === id))
            const validIds = matchedIds.length > 0
              ? matchedIds
              : allProducts.sort((a, b) => b.rating - a.rating).slice(0, 8).map(p => p.id)

            const matchedProducts = await db.product.findMany({
              where: { id: { in: validIds } },
              include: { seller: { select: { id: true, name: true, avatar: true } } },
            })

            const results = matchedProducts.map(p => {
              const match = matches.find((m: any) => m.productId === p.id)
              return { ...p, matchScore: match?.matchScore ?? 0.5, matchReason: match?.matchReason ?? 'Similar to your image' }
            }).sort((a: any, b: any) => b.matchScore - a.matchScore)

            return NextResponse.json({
              analysis: parsed.analysis || 'Product identified from your image',
              identifiedCategory: parsed.identifiedCategory || '',
              identifiedTags: parsed.identifiedTags || [],
              colorScheme: parsed.colorScheme || [],
              style: parsed.style || '',
              results,
            })
          }
        }
      } catch (err) {
        console.error('[Image Search] Gemini Vision failed, using fallback:', err)
      }
    }

    // ─── Fallback: keyword matching ────────────────────────────────────
    const keywords = extractKeywordsFromFilename(file.name)
    let matched: any[]
    let analysis: string

    if (keywords.length > 0) {
      const scored = matchProductsByKeywords(keywords, allProducts)
      if (scored.length > 0) {
        matched = scored.slice(0, 8)
        analysis = `Detected keywords: "${keywords.join(', ')}". Found ${matched.length} matching products.`
      } else {
        matched = allProducts.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount).slice(0, 8)
        analysis = `No exact matches for "${keywords.join(', ')}". Showing popular products.`
      }
    } else {
      matched = allProducts.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount).slice(0, 8)
      analysis = 'Add a Google AI API key for real image recognition. Currently showing popular products.'
    }

    const results = matched.map((m: any) => ({
      ...m.product,
      matchScore: Math.min(m.score / 10, 0.95),
      matchReason: m.score > 8 ? 'Strong match' : m.score > 4 ? 'Related product' : 'Popular product',
    }))

    return NextResponse.json({ analysis, identifiedCategory: '', identifiedTags: keywords, colorScheme: [], style: '', results })
  } catch (error) {
    console.error('[Image Search] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
