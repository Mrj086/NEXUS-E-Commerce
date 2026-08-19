

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ScoredProduct {
  id: string
  score: number
  reason: string
  reasonDetail: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId query parameter is required' },
        { status: 400 }
      )
    }

    // Get customer info
    const customer = await db.user.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get browsing history for this customer
    const browsingHistory = await db.browsingHistory.findMany({
      where: { customerId },
      include: { product: true },
    })

    // Get customer's past orders for collaborative filtering
    const pastOrders = await db.order.findMany({
      where: { customerId },
      include: {
        items: { include: { product: true } },
      },
    })

    // Get all active products
    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        seller: {
          select: { id: true, name: true },
        },
      },
    })

    // ─── Advanced Scoring Engine ──────────────────────────────────────────

    // 1. Build category frequency map from browsing history
    const categoryCounts: Record<string, number> = {}
    const subcategoryCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    let maxCategoryCount = 1

    for (const entry of browsingHistory) {
      const cat = entry.product.category
      categoryCounts[cat] = (categoryCounts[cat] || 0) + entry.viewCount
      if (categoryCounts[cat] > maxCategoryCount) maxCategoryCount = categoryCounts[cat]

      if (entry.product.subcategory) {
        subcategoryCounts[entry.product.subcategory] = (subcategoryCounts[entry.product.subcategory] || 0) + entry.viewCount
      }

      // Parse product tags and accumulate
      if (entry.product.tags) {
        for (const tag of entry.product.tags.split(',').map(t => t.trim())) {
          if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + entry.viewCount
        }
      }
    }

    // 2. Build purchased category/tag map from order history
    const purchasedCategories = new Set<string>()
    const purchasedTags = new Set<string>()
    const purchasedProductIds = new Set<string>()

    for (const order of pastOrders) {
      for (const item of order.items) {
        if (item.product) {
          purchasedCategories.add(item.product.category)
          purchasedProductIds.add(item.product.id)
          if (item.product.tags) {
            for (const tag of item.product.tags.split(',').map(t => t.trim())) {
              if (tag) purchasedTags.add(tag)
            }
          }
        }
      }
    }

    // 3. Tag weights normalization
    const maxTagCount = Math.max(...Object.values(tagCounts), 1)

    // 4. Score each product with multi-factor algorithm
    const scored: ScoredProduct[] = products.map((product) => {
      let ageScore = 0
      let professionScore = 0
      let browsingScore = 0
      let tagMatchScore = 0
      let purchaseCorrelationScore = 0
      let popularityBoost = 0
      let featuredBoost = 0
      const reasons: string[] = []
      let reasonDetail = ''

      // ── Factor 1: Age Match (25%) ──
      if (customer.age && product.targetAgeMin && product.targetAgeMax) {
        if (customer.age >= product.targetAgeMin && customer.age <= product.targetAgeMax) {
          ageScore = 1
          reasons.push('Perfect age match')
        } else {
          const range = product.targetAgeMax - product.targetAgeMin
          if (range > 0) {
            const dist = Math.min(
              Math.abs(customer.age - product.targetAgeMin),
              Math.abs(customer.age - product.targetAgeMax)
            )
            ageScore = Math.max(0, 1 - dist / range) * 0.6
          }
        }
      } else if (!product.targetAgeMin && !product.targetAgeMax) {
        ageScore = 0.4
      }

      // ── Factor 2: Profession Match (20%) ──
      if (customer.profession && product.targetProfessions) {
        const targetList = product.targetProfessions
          .split(',')
          .map((p) => p.trim().toLowerCase())
        if (targetList.includes(customer.profession.toLowerCase())) {
          professionScore = 1
          reasons.push('Ideal for your profession')
        } else {
          professionScore = 0
        }
      } else if (!product.targetProfessions) {
        professionScore = 0.4
      }

      // ── Factor 3: Browsing History / Category Match (20%) ──
      const catCount = categoryCounts[product.category] || 0
      if (catCount > 0) {
        browsingScore = catCount / maxCategoryCount
        reasons.push('Based on your interests')
      }

      // ── Factor 4: Tag Similarity (15%) ──
      if (product.tags && Object.keys(tagCounts).length > 0) {
        const productTags = product.tags.split(',').map(t => t.trim()).filter(Boolean)
        let tagOverlap = 0
        for (const tag of productTags) {
          if (tagCounts[tag]) {
            tagOverlap += tagCounts[tag] / maxTagCount
          }
        }
        tagMatchScore = Math.min(1, tagOverlap / Math.max(productTags.length * 0.3, 1))
        if (tagMatchScore > 0.5) reasons.push('Matches your style')
      }

      // ── Factor 5: Purchase Correlation / Collaborative (10%) ──
      if (purchasedCategories.size > 0) {
        if (purchasedCategories.has(product.category)) {
          purchaseCorrelationScore = 0.3 // Slight boost for same category
        }
        // Cross-category: if purchased tags overlap
        if (product.tags) {
          const productTagSet = new Set(product.tags.split(',').map(t => t.trim().toLowerCase()))
          let overlap = 0
          for (const tag of purchasedTags) {
            if (productTagSet.has(tag)) overlap++
          }
          purchaseCorrelationScore += Math.min(0.7, overlap * 0.15)
        }
      }

      // ── Factor 6: Popularity Boost (5%) ──
      if (product.reviewCount > 50) {
        popularityBoost = 0.3
        if (product.rating >= 4.5) {
          popularityBoost = 0.5
          reasons.push('Top rated by customers')
        }
      } else if (product.reviewCount > 20) {
        popularityBoost = 0.2
      }

      // ── Factor 7: Featured Boost (5%) ──
      if (product.isFeatured) {
        featuredBoost = 0.3
        if (!reasons.some(r => r.includes('Featured'))) {
          reasons.push('Editor\'s pick')
        }
      }

      // ── Weighted Total Score ──
      const totalScore =
        ageScore * 0.25 +
        professionScore * 0.20 +
        browsingScore * 0.20 +
        tagMatchScore * 0.15 +
        purchaseCorrelationScore * 0.10 +
        popularityBoost * 0.05 +
        featuredBoost * 0.05

      // Build detailed reason
      reasonDetail = reasons.length > 0
        ? reasons.slice(0, 2).join(' · ')
        : 'Recommended for you'

      return {
        id: product.id,
        score: totalScore,
        reason: reasonDetail,
        reasonDetail: reasons.join(', '),
      }
    })

    // Sort by score descending, take top 12
    scored.sort((a, b) => b.score - a.score)
    const topIds = scored.slice(0, 12)

    // Fetch full product data for top recommendations
    const topProducts = await db.product.findMany({
      where: { id: { in: topIds.map((s) => s.id) } },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Attach scores and reasons
    const recommendations = topProducts.map((p) => {
      const scoredItem = topIds.find((s) => s.id === p.id)
      return {
        ...p,
        recommendationScore: scoredItem?.score ?? 0,
        recommendationReason: scoredItem?.reason ?? 'Recommended for you',
      }
    })

    // Sort by score
    recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
