import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { geminiChat, isGeminiAvailable } from '@/lib/gemini'

// ─── Product Cache ─────────────────────────────────────────────────────

interface ProductInfo {
  name: string
  description: string
  price: number
  discountPrice: number | null
  category: string
  subcategory: string | null
  tags: string
  stockQuantity: number
  rating: number
  reviewCount: number
  sellerName: string
  isFeatured: boolean
  imageUrl: string | null
}

let productCache: { data: ProductInfo[]; timestamp: number } = { data: [], timestamp: 0 }
const CACHE_DURATION = 5 * 60 * 1000

async function getProductCatalog(): Promise<ProductInfo[]> {
  const now = Date.now()
  if (productCache.data.length > 0 && (now - productCache.timestamp) < CACHE_DURATION) {
    return productCache.data
  }

  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: { seller: { select: { name: true } } },
      orderBy: { name: 'asc' },
    })

    productCache = {
      data: products.map(p => ({
        name: p.name,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice,
        category: p.category,
        subcategory: p.subcategory,
        tags: p.tags,
        stockQuantity: p.stockQuantity,
        rating: p.rating,
        reviewCount: p.reviewCount,
        sellerName: p.seller.name,
        isFeatured: p.isFeatured,
        imageUrl: p.imageUrl,
      })),
      timestamp: now,
    }
  } catch (err) {
    console.error('[Chat API] Failed to fetch products:', err)
  }

  return productCache.data
}

// ─── Fallback: Smart Product Matching (no AI key) ──────────────────────

function matchProducts(query: string, products: ProductInfo[]): ProductInfo[] {
  const q = query.toLowerCase()
  const scored = products.map(p => {
    let score = 0
    const name = p.name.toLowerCase()
    const desc = p.description.toLowerCase()
    const cat = p.category.toLowerCase()
    const sub = (p.subcategory || '').toLowerCase()
    const tags = p.tags.toLowerCase()
    if (name.includes(q)) score += 10
    const queryWords = q.split(/\s+/)
    for (const word of queryWords) {
      if (word.length < 2) continue
      if (name.includes(word)) score += 5
      if (desc.includes(word)) score += 2
      if (cat.includes(word)) score += 4
      if (sub && sub.includes(word)) score += 3
      if (tags.includes(word)) score += 3
    }
    if (p.isFeatured) score += 1
    return { product: p, score }
  })
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.product)
}

function formatProduct(p: ProductInfo): string {
  const price = p.discountPrice
    ? `~~$${p.price.toFixed(2)}~~ **$${p.discountPrice.toFixed(2)}**`
    : `$${p.price.toFixed(2)}`
  const stock = p.stockQuantity > 20 ? 'In Stock' : p.stockQuantity > 0 ? `Low Stock (${p.stockQuantity} left)` : 'Out of Stock'
  return `**${p.name}** - ${price} (${stock})\n${p.description}\nRating: ${p.rating}/5 (${p.reviewCount} reviews) | Sold by: ${p.sellerName}`
}

function generateFallbackResponse(query: string, products: ProductInfo[], role: string): string {
  const q = query.toLowerCase()

  if (/^(hi|hello|hey|good morning|good evening|howdy|sup|what'?s up)\b/i.test(q)) {
    const randomProducts = products.filter(p => p.isFeatured).slice(0, 3)
    let msg = "Hello! Welcome to NEXUS! I'd love to help you find something great. "
    if (randomProducts.length > 0) {
      msg += "Here are some of our featured products:\n\n"
      msg += randomProducts.map(p => `- **${p.name}** - $${(p.discountPrice || p.price).toFixed(2)} (${p.rating}/5)`).join('\n')
    }
    msg += "\n\nWhat are you looking for today?"
    return msg
  }

  if (/^(thanks?|thank you|thx|ty|appreciate)\b/i.test(q)) {
    return "You're welcome! Let me know if you need anything else. Happy shopping!"
  }

  if (/\b(deal|discount|sale|cheap|budget|afford|under \$|below \$|less than)\b/i.test(q)) {
    const priceMatch = q.match(/\$(\d+)/)
    const maxPrice = priceMatch ? parseInt(priceMatch[1]) : 200
    const deals = products.filter(p => p.discountPrice && p.discountPrice <= maxPrice).sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price)).slice(0, 4)
    if (deals.length > 0) {
      let msg = `Here are the best deals ${maxPrice < 1000 ? `under $${maxPrice}` : 'available'}:\n\n`
      msg += deals.map(p => `**${p.name}** - ~~$${p.price.toFixed(2)}~~ **$${p.discountPrice!.toFixed(2)}** (Save $${(p.price - p.discountPrice!).toFixed(2)})`).join('\n')
      return msg
    }
    return `I'd love to help you find deals! Could you tell me your budget range? We have products from $29.99 to $1499.99.`
  }

  if (/\b(best|top|highest rated|most popular|recommend|good|great|quality)\b/i.test(q)) {
    const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 5)
    let msg = "Here are our top-rated products:\n\n"
    msg += topRated.map(p => `**${p.name}** - $${(p.discountPrice || p.price).toFixed(2)} (${p.rating}/5, ${p.reviewCount} reviews)`).join('\n')
    return msg
  }

  if (/\b(compare|vs|versus|difference between|which is better)\b/i.test(q)) {
    const matched = matchProducts(q, products).slice(0, 3)
    if (matched.length >= 2) {
      let msg = "Here's a comparison:\n\n"
      msg += matched.map(p => `**${p.name}**\n- Price: $${(p.discountPrice || p.price).toFixed(2)}\n- Rating: ${p.rating}/5\n- ${p.description}`).join('\n\n')
      return msg
    } else if (matched.length === 1) {
      return `I found **${matched[0].name}** matching your query. Could you tell me which other product you'd like to compare it with?`
    }
  }

  if (/\b(gift|present|birthday|anniversary|christmas|holiday)\b/i.test(q)) {
    const gifts = products.filter(p => p.rating >= 4.3).sort(() => Math.random() - 0.5).slice(0, 5)
    let msg = "Great gift ideas from NEXUS:\n\n"
    msg += gifts.map(p => `**${p.name}** - $${(p.discountPrice || p.price).toFixed(2)} (${p.rating}/5) - ${p.category}`).join('\n')
    msg += "\n\nWould you like more details on any of these?"
    return msg
  }

  if (/\b(developer|programmer|coder|software|tech|programming|coding)\b/i.test(q)) {
    const techProducts = products.filter(p => p.tags.includes('developer') || p.tags.includes('computer') || p.tags.includes('programming') || p.category === 'Electronics').slice(0, 5)
    let msg = "Here are some great picks for developers:\n\n"
    msg += techProducts.map(p => formatProduct(p)).join('\n\n')
    return msg
  }

  const categoryKeywords: Record<string, string[]> = {
    'Electronics': ['laptop', 'computer', 'phone', 'headphone', 'monitor', 'keyboard', 'mouse', 'speaker', 'audio', 'tech', 'electronic'],
    'Fashion': ['fashion', 'bag', 'backpack', 'watch', 'sunglass', 'glasses', 'clothing', 'wear', 'style', 'outfit'],
    'Home & Garden': ['home', 'furniture', 'chair', 'desk', 'lamp', 'light', 'office', 'room', 'decor'],
    'Books': ['book', 'read', 'learn', 'study', 'programming book', 'design book'],
    'Sports': ['sport', 'yoga', 'exercise', 'fitness', 'running', 'shoe', 'gym', 'workout', 'training'],
    'Beauty': ['beauty', 'skin', 'skincare', 'cosmetic', 'face', 'moistur'],
    'Food': ['coffee', 'food', 'beverage', 'drink', 'tea', 'organic'],
    'Toys': ['toy', 'kid', 'child', 'robot', 'stem', 'education', 'learning kit'],
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (q.includes(kw)) {
        const catProducts = products.filter(p => p.category === category)
        if (catProducts.length > 0) {
          let msg = `Here's what we have in **${category}**:\n\n`
          msg += catProducts.map(p => formatProduct(p)).join('\n\n')
          return msg
        }
      }
    }
  }

  const matched = matchProducts(query, products)
  if (matched.length > 0) {
    let msg = `I found ${matched.length} product${matched.length > 1 ? 's' : ''} matching your query:\n\n`
    msg += matched.map(p => formatProduct(p)).join('\n\n')
    return msg
  }

  if (role === 'SELLER') {
    return "I can help you with your seller dashboard! Try asking about:\n\n- Sales optimization strategies\n- Product listing tips\n- Pricing strategies\n- Inventory management\n- Customer engagement ideas"
  }

  return `I'd be happy to help! I have access to ${products.length} products across categories like Electronics, Fashion, Books, Sports, and more.\n\nTry asking me about:\n- A specific product (e.g., \"laptop\" or \"headphones\")\n- Deals and discounts\n- Top-rated products\n- Gift ideas\n- Product comparisons`
}

// ─── System Prompt Builder (for Gemini AI) ──────────────────────────────

async function buildSystemPrompt(role: string): Promise<string> {
  const products = await getProductCatalog()
  const productKnowledge = products.map((p, i) => {
    const price = p.discountPrice
      ? `~~$${p.price.toFixed(2)}~~ **$${p.discountPrice.toFixed(2)}**`
      : `$${p.price.toFixed(2)}`
    const stockStatus = p.stockQuantity > 20 ? 'In Stock' : p.stockQuantity > 0 ? `Low Stock (${p.stockQuantity} left)` : 'Out of Stock'
    return `${i + 1}. **${p.name}** (${p.category}${p.subcategory ? '/' + p.subcategory : ''})
   - Price: ${price}
   - Rating: ${p.rating}/5 (${p.reviewCount} reviews) ${p.isFeatured ? 'Featured' : ''}
   - ${stockStatus}
   - ${p.description}
   - Tags: ${p.tags}
   - Sold by: ${p.sellerName}`
  }).join('\n\n')

  const base = `You are NEXUS AI — an intelligent, friendly shopping assistant for the NEXUS e-commerce platform. You have COMPLETE knowledge of ALL products in the store.

## PRODUCT CATALOG (${products.length} products):

${productKnowledge}

## YOUR CAPABILITIES:
- Product Recommendations based on preferences, budget, profession, age
- Product Comparison of features, prices, ratings
- Detailed Product Info including specs, pricing, stock
- Order Help with tracking, returns, shipping
- Shopping Advice and deal alerts

## RESPONSE GUIDELINES:
- Reference specific products by name
- Mention prices and discounts when relevant
- If out of stock, suggest alternatives
- Keep responses concise (2-4 paragraphs max)
- Use **bold** for emphasis, - for bullet points
- Be conversational and friendly`

  if (role === 'SELLER') {
    return base + `\n## SELLER MODE: Help with sales analytics, product listing optimization, pricing strategies, inventory management, customer review analysis, and marketing ideas. Be data-driven.`
  }

  return base + `\n## CUSTOMER MODE: Help find products, compare options, understand features, suggest deals and gift ideas. Be warm and proactive.`
}

// ─── POST Handler ──────────────────────────────────────────────────────

interface ChatRequestBody {
  message: string
  role: string
  history?: { role: string; content: string }[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json()
    const { message, role, history = [] } = body

    if (!message || !role) {
      return NextResponse.json({ error: 'message and role are required' }, { status: 400 })
    }

    const products = await getProductCatalog()

    // Try Gemini AI first
    if (isGeminiAvailable()) {
      try {
        const systemPrompt = await buildSystemPrompt(role)
        const reply = await geminiChat({
          systemPrompt,
          userMessage: message,
          history,
        })
        if (reply) {
          return NextResponse.json({ reply })
        }
      } catch (err) {
        console.error('[Chat API] Gemini failed, using fallback:', err)
      }
    }

    // Fallback: smart product matching
    const reply = generateFallbackResponse(message, products, role)
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[Chat API] Error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
