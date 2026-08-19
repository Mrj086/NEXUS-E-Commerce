import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { geminiChat, isGeminiAvailable } from '@/lib/gemini'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    const customer = await db.user.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const [browsingHistory, pastOrders, allProducts] = await Promise.all([
      db.browsingHistory.findMany({
        where: { customerId },
        include: { product: true },
        orderBy: { lastViewedAt: 'desc' },
        take: 30,
      }),
      db.order.findMany({
        where: { customerId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.product.findMany({
        where: { isActive: true, stockQuantity: { gt: 0 } },
        include: { seller: { select: { id: true, name: true, avatar: true } } },
      }),
    ])

    const viewedCategories = [...new Set(browsingHistory.map(b => b.product.category))]
    const viewedProducts = browsingHistory.slice(0, 10).map(b => ({
      name: b.product.name, category: b.product.category, tags: b.product.tags, price: b.product.price, views: b.viewCount,
    }))
    const purchasedProducts = pastOrders.flatMap(o =>
      o.items.map(item => ({ name: item.productName, category: item.product?.category || 'Unknown', price: item.productPrice }))
    )
    const purchasedCategories = [...new Set(purchasedProducts.map(p => p.category))]
    const priceRange = viewedProducts.length > 0
      ? { min: Math.min(...viewedProducts.map(p => p.price)), max: Math.max(...viewedProducts.map(p => p.price)) }
      : { min: 0, max: 1000 }

    const userProfile = {
      name: customer.name, age: customer.age, profession: customer.profession,
      viewedCategories, purchasedCategories, pricePreference: priceRange,
      recentViews: viewedProducts.slice(0, 5), purchaseHistory: purchasedProducts.slice(0, 5),
      totalBrowsed: browsingHistory.length, totalPurchased: pastOrders.length,
    }

    const productCatalog = allProducts.map(p => ({
      id: p.id, name: p.name, category: p.category, subcategory: p.subcategory,
      tags: p.tags, price: p.price, discountPrice: p.discountPrice,
      rating: p.rating, reviewCount: p.reviewCount, isFeatured: p.isFeatured,
      description: p.description.slice(0, 80),
    }))

    let aiRecommendations: Array<{ id: string; reason: string; matchScore: number }> = []

    // Try Gemini AI
    if (isGeminiAvailable()) {
      try {
        const systemPrompt = `You are an AI product recommendation engine for NEXUS e-commerce.
Analyze the customer profile and recommend products.

Respond with ONLY a valid JSON array: [{"id": "product_id", "reason": "short reason", "matchScore": 0.0-1.0}]

Rules:
- Recommend 8-10 products matching user interests
- Don't recommend products viewed extensively (viewCount > 5)
- Prioritize matching categories, price range, profession
- matchScore: 0.7+ strong, 0.4-0.7 moderate
- If new user, recommend popular/featured across diverse categories`

        const userPrompt = `Customer Profile:
${JSON.stringify(userProfile, null, 2)}

Available Products:
${JSON.stringify(productCatalog, null, 2)}

Return JSON array of top 10 recommended products.`

        const reply = await geminiChat({ systemPrompt, userMessage: userPrompt })
        if (reply) {
          const jsonMatch = reply.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            aiRecommendations = JSON.parse(jsonMatch[0])
          }
        }
      } catch (err) {
        console.error('[Recommendations] Gemini failed, using fallback:', err)
      }
    }

    // Fallback: rule-based
    if (aiRecommendations.length === 0) {
      aiRecommendations = generateFallbackRecommendations(userProfile, productCatalog, browsingHistory)
    }

    const recommendedIds = aiRecommendations.map(r => r.id).filter(Boolean)
    const validIds = recommendedIds.filter(id => allProducts.some(p => p.id === id))
    const finalIds = validIds.length > 0
      ? validIds
      : allProducts.sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount)).slice(0, 10).map(p => p.id)

    const recommendedProducts = await db.product.findMany({
      where: { id: { in: finalIds } },
      include: { seller: { select: { id: true, name: true, avatar: true } } },
    })

    const results = recommendedProducts.map(p => {
      const aiRec = aiRecommendations.find(r => r.id === p.id)
      return { ...p, recommendationScore: aiRec?.matchScore ?? 0.5, recommendationReason: aiRec?.reason ?? 'Recommended for you' }
    }).sort((a, b) => b.recommendationScore - a.recommendationScore)

    return NextResponse.json({ recommendations: results })
  } catch (error) {
    console.error('[Recommendations] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateFallbackRecommendations(
  profile: Record<string, unknown>,
  catalog: Array<Record<string, unknown>>,
  history: Array<{ product: { category: string; tags: string; price: number; id: string }; viewCount: number }>,
): Array<{ id: string; reason: string; matchScore: number }> {
  const viewedIds = new Set(history.filter(h => h.product && h.viewCount > 5).map(h => h.product.id))
  const viewedCats: Record<string, number> = {}
  history.forEach(h => { viewedCats[h.product.category] = (viewedCats[h.product.category] || 0) + h.viewCount })

  return catalog
    .filter(p => !viewedIds.has(p.id as string))
    .map(p => {
      let score = 0.5
      const reasons: string[] = []
      if (viewedCats[p.category as string]) { score += 0.2; reasons.push('Based on your browsing interests') }
      if (p.isFeatured) { score += 0.1; reasons.push("Editor's pick") }
      if ((p.rating as number) >= 4.5) { score += 0.1; reasons.push('Highly rated by customers') }
      return { id: p.id as string, reason: reasons.length > 0 ? reasons.slice(0, 2).join(' - ') : 'Recommended for you', matchScore: Math.min(1, score) }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10)
}
