/**
 * Extract @mentions from text content
 * Returns an array of unique user IDs mentioned (without the @ symbol)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const matches = content.matchAll(mentionRegex)
  const userIds = Array.from(matches, (match) => match[1])
  
  // Return unique user IDs
  return [...new Set(userIds)]
}

/**
 * URL regex pattern - matches http, https, and common URL patterns
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi

/**
 * Extract URLs from text content
 */
export function extractUrls(content: string): string[] {
  const matches = content.match(URL_REGEX)
  return matches || []
}

/**
 * Parse content and split it into text segments, mention objects, link objects, and hashtag objects
 * Returns an array of segments that can be rendered as JSX
 */
export function parseMentions(content: string): Array<
  | { type: 'text'; content: string }
  | { type: 'mention'; userId: string }
  | { type: 'link'; url: string; originalUrl: string }
  | { type: 'hashtag'; tag: string }
> {
  const segments: Array<{ type: 'text' | 'mention' | 'link' | 'hashtag'; content?: string; userId?: string; url?: string; originalUrl?: string; tag?: string }> = []
  
  // First, find all mentions, URLs, and hashtags with their positions
  const mentions: Array<{ type: 'mention'; start: number; end: number; userId: string }> = []
  const links: Array<{ type: 'link'; start: number; end: number; url: string; originalUrl: string }> = []
  const hashtags: Array<{ type: 'hashtag'; start: number; end: number; tag: string }> = []
  
  // Find mentions
  const mentionRegex = /@(\w+)/g
  let match
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      type: 'mention',
      start: match.index,
      end: match.index + match[0].length,
      userId: match[1],
    })
  }
  
  // Find hashtags
  const hashtagRegex = /#(\w+)/g
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push({
      type: 'hashtag',
      start: match.index,
      end: match.index + match[0].length,
      tag: match[1],
    })
  }
  
  // Find URLs
  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(content)) !== null) {
    const originalUrl = match[0]
    // Ensure URL starts with http:// or https:// for href
    let normalizedUrl = originalUrl
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }
    links.push({
      type: 'link',
      start: match.index,
      end: match.index + match[0].length,
      url: normalizedUrl,
      originalUrl, // Store original for display
    })
  }
  
  // Merge and sort all matches by position
  const allMatches = [
    ...mentions.map(m => ({ ...m, type: 'mention' as const })),
    ...links.map(m => ({ ...m, type: 'link' as const })),
    ...hashtags.map(m => ({ ...m, type: 'hashtag' as const })),
  ].sort((a, b) => a.start - b.start)
  
  // Remove overlapping matches (prioritize mentions over links)
  const filteredMatches: typeof allMatches = []
  for (let i = 0; i < allMatches.length; i++) {
    const current = allMatches[i]
    const overlaps = filteredMatches.some(
      existing => 
        (current.start >= existing.start && current.start < existing.end) ||
        (current.end > existing.start && current.end <= existing.end) ||
        (current.start <= existing.start && current.end >= existing.end)
    )
    if (!overlaps) {
      filteredMatches.push(current)
    }
  }
  
  // Build segments
  let lastIndex = 0
  for (const match of filteredMatches) {
    // Add text before the match
    if (match.start > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.start),
      })
    }
    
    // Add the match
    if (match.type === 'mention') {
      segments.push({
        type: 'mention',
        userId: match.userId,
      })
    } else if (match.type === 'link') {
      segments.push({
        type: 'link',
        url: match.url,
        originalUrl: match.originalUrl,
      })
    } else if (match.type === 'hashtag') {
      segments.push({
        type: 'hashtag',
        tag: match.tag,
      })
    }
    
    lastIndex = match.end
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex),
    })
  }
  
  // If no matches found, return the whole content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content,
    })
  }
  
  return segments as Array<
    | { type: 'text'; content: string }
    | { type: 'mention'; userId: string }
    | { type: 'link'; url: string; originalUrl: string }
    | { type: 'hashtag'; tag: string }
  >
}

/**
 * Calculate the effective character count for content
 * Links count as 23 characters regardless of their actual length
 * Mentions (@username) are not counted in the character limit
 */
export function calculateEffectiveLength(content: string): number {
  const urls = extractUrls(content)
  const mentions = extractMentions(content)
  let length = content.length
  
  // For each URL found, subtract its actual length and add 23
  for (const url of urls) {
    length = length - url.length + 23
  }
  
  // For each mention found, subtract its actual length (mentions don't count)
  // Mention format: @username (including the @ symbol)
  const mentionRegex = /@(\w+)/g
  let match
  while ((match = mentionRegex.exec(content)) !== null) {
    const mentionLength = match[0].length // Includes @ and username
    length = length - mentionLength
  }
  
  return length
}

