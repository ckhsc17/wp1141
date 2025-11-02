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
      })}
    </Box>
  )
}

