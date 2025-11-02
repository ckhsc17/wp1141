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
 * Parse content and split it into text segments and mention objects
 * Returns an array of segments that can be rendered as JSX
 */
export function parseMentions(content: string): Array<
  | { type: 'text'; content: string }
  | { type: 'mention'; userId: string }
> {
  const mentionRegex = /@(\w+)/g
  const segments: Array<{ type: 'text' | 'mention'; content?: string; userId?: string }> = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      })
    }

    // Add the mention
    segments.push({
      type: 'mention',
      userId: match[1],
    })

    lastIndex = mentionRegex.lastIndex
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex),
    })
  }

  // If no mentions found, return the whole content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content,
    })
  }

  return segments as Array<
    | { type: 'text'; content: string }
    | { type: 'mention'; userId: string }
  >
}

