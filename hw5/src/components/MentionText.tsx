'use client'

import { Box } from '@mui/material'
import Link from 'next/link'
import { parseMentions } from '@/utils/mention'

interface MentionTextProps {
  content: string
}

export default function MentionText({ content }: MentionTextProps) {
  const segments = parseMentions(content)

  return (
    <Box component="span">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>
        }

        if (segment.type === 'mention') {
          // Render mention as clickable link
          return (
            <Link
              key={index}
              href={`/profile/${segment.userId}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                @{segment.userId}
              </Box>
            </Link>
          )
        }

        if (segment.type === 'link') {
          // Render URL as clickable link (display original URL, link to normalized URL)
          return (
            <Link
              key={index}
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {segment.originalUrl}
              </Box>
            </Link>
          )
        }

        return null
      })}
    </Box>
  )
}

