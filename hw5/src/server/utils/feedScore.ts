export interface EngagementWeights {
  baseWeight?: number
  likeWeight?: number
  commentWeight?: number
  repostWeight?: number
  halfLifeHours?: number
}

export interface TrendingScoreInput {
  likes: number
  comments: number
  reposts: number
  createdAt: Date | string
}

const DEFAULT_WEIGHTS: Required<EngagementWeights> = {
  baseWeight: 1,
  likeWeight: 2,
  commentWeight: 3,
  repostWeight: 4,
  halfLifeHours: 24,
}

export function calculateTrendingScore(
  input: TrendingScoreInput,
  weights: EngagementWeights = {}
) {
  const config = { ...DEFAULT_WEIGHTS, ...weights }

  const baseEngagement =
    config.baseWeight +
    input.likes * config.likeWeight +
    input.comments * config.commentWeight +
    input.reposts * config.repostWeight

  const createdAt = new Date(input.createdAt).getTime()
  const hoursSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60)
  const decayFactor = Math.pow(0.5, Math.max(hoursSinceCreation, 0) / config.halfLifeHours)

  return baseEngagement * decayFactor
}

export function extractTrendingInputFromPost(post: any): TrendingScoreInput {
  return {
    likes: post?._count?.likes ?? 0,
    comments: post?._count?.comments ?? 0,
    reposts: post?._count?.repostRecords ?? 0,
    createdAt: post.createdAt,
  }
}


