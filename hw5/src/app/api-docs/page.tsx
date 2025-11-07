'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Box } from '@mui/material'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Echoo API',
    version: '1.0.0',
    description: 'REST API documentation for the Echoo social platform built with Next.js.',
  },
  servers: [],
  tags: [
    { name: 'Posts', description: 'Create and manage posts and timelines.' },
    { name: 'Comments', description: 'Reply to posts and manage threaded conversations.' },
    { name: 'Likes', description: 'Toggle likes for posts and comments.' },
    { name: 'Reposts', description: 'Repost posts or comments and inspect repost status.' },
    { name: 'Drafts', description: 'Store and manage unpublished drafts.' },
    { name: 'Notifications', description: 'Retrieve real-time notification data.' },
    { name: 'Mentions', description: 'Work with @mention notifications.' },
    { name: 'Users', description: 'User profiles, search, follow relationships and account management.' },
    { name: 'Realtime', description: 'Realtime integrations such as Pusher channel auth.' },
    { name: 'Integrations', description: 'Third-party and platform integrations.' },
  ],
  paths: {
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'List public posts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of posts' },
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a new post',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { content: { type: 'string', maxLength: 280 } },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Post created' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/posts/following': {
      get: {
        tags: ['Posts'],
        summary: 'Get timeline posts from followed users',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of followed posts' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get post by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Post details' },
          '404': { description: 'Post not found' },
        },
      },
      put: {
        tags: ['Posts'],
        summary: 'Update a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { content: { type: 'string', maxLength: 280 } },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Post updated' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Post not found' },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Post deleted' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Post not found' },
        },
      },
    },
    '/api/posts/{id}/comments': {
      get: {
        tags: ['Comments'],
        summary: 'List comments for a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'List of comments' },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Create a comment on a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { content: { type: 'string', maxLength: 280 } },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Comment created' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/posts/{id}/like': {
      post: {
        tags: ['Likes'],
        summary: 'Toggle like on a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Like toggled' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/posts/{id}/like/status': {
      get: {
        tags: ['Likes'],
        summary: 'Check like status for a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Like status' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/posts/{id}/repost': {
      post: {
        tags: ['Reposts'],
        summary: 'Toggle repost on a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Repost toggled' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/posts/{id}/repost/status': {
      get: {
        tags: ['Reposts'],
        summary: 'Check repost status for a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Repost status' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/comments/{id}': {
      get: {
        tags: ['Comments'],
        summary: 'Get comment by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Comment details' },
          '404': { description: 'Comment not found' },
        },
      },
      delete: {
        tags: ['Comments'],
        summary: 'Delete a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Comment deleted' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Comment not found' },
        },
      },
    },
    '/api/comments/{id}/replies': {
      get: {
        tags: ['Comments'],
        summary: 'List replies for a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'List of replies' },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Create a reply for a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { content: { type: 'string', maxLength: 280 } },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Reply created' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/comments/{id}/like': {
      post: {
        tags: ['Likes'],
        summary: 'Toggle like on a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Like toggled' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/comments/{id}/like/status': {
      get: {
        tags: ['Likes'],
        summary: 'Check like status for a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Like status' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/comments/{id}/repost': {
      post: {
        tags: ['Reposts'],
        summary: 'Toggle repost on a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Repost toggled' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/comments/{id}/repost/status': {
      get: {
        tags: ['Reposts'],
        summary: 'Check repost status for a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Repost status' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/drafts': {
      get: {
        tags: ['Drafts'],
        summary: 'List drafts for the current user',
        responses: {
          '200': { description: 'List of drafts' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Drafts'],
        summary: 'Create a new draft',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { content: { type: 'string', maxLength: 280 } },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Draft created' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/drafts/{id}': {
      get: {
        tags: ['Drafts'],
        summary: 'Get draft by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Draft details' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Draft not found' },
        },
      },
      put: {
        tags: ['Drafts'],
        summary: 'Update a draft',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { content: { type: 'string', maxLength: 280 } },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Draft updated' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Draft not found' },
        },
      },
      delete: {
        tags: ['Drafts'],
        summary: 'Delete a draft',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Draft deleted' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Draft not found' },
        },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications for the current user',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of notifications' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/notifications/unread': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        responses: {
          '200': { description: 'Unread notification count' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/mentions': {
      get: {
        tags: ['Mentions'],
        summary: 'List mentions for the current user',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of mentions' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Mentions'],
        summary: 'Mark all mentions as read',
        responses: {
          '200': { description: 'All mentions marked as read' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/mentions/{id}': {
      put: {
        tags: ['Mentions'],
        summary: 'Mark a mention as read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Mention marked as read' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Mention not found' },
        },
      },
    },
    '/api/mentions/unread': {
      get: {
        tags: ['Mentions'],
        summary: 'Get unread mention count',
        responses: {
          '200': { description: 'Unread mention count' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Get user profile by userId',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User profile' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/api/users/{userId}/posts': {
      get: {
        tags: ['Users', 'Posts'],
        summary: 'Get posts authored by a user',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of user posts' },
        },
      },
    },
    '/api/users/{userId}/reposts': {
      get: {
        tags: ['Users', 'Reposts'],
        summary: 'Get reposts made by a user',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of user reposts' },
        },
      },
    },
    '/api/users/{userId}/likes': {
      get: {
        tags: ['Users', 'Likes'],
        summary: 'Get posts liked by the current user',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of liked posts' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/users/{userId}/follow': {
      get: {
        tags: ['Users'],
        summary: 'Check follow status for a user',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Follow status' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Toggle follow/unfollow for a user',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Follow toggled' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/users/{userId}/check': {
      get: {
        tags: ['Users'],
        summary: 'Check whether a userId is available',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Availability result' },
        },
      },
    },
    '/api/users/profile': {
      put: {
        tags: ['Users'],
        summary: 'Update the current user profile',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/users/search': {
      get: {
        tags: ['Users'],
        summary: 'Search for users by keyword',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': { description: 'Matching users' },
        },
      },
    },
    '/api/users/setup': {
      post: {
        tags: ['Users'],
        summary: 'Assign a custom userId to the current user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '200': { description: 'userId assigned' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/users/delete': {
      delete: {
        tags: ['Users'],
        summary: 'Permanently delete the current user and all data',
        responses: {
          '200': { description: 'Account deleted' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/pusher/auth': {
      post: {
        tags: ['Realtime'],
        summary: 'Authenticate a private Pusher channel subscription',
        requestBody: { required: true },
        responses: {
          '200': { description: 'Authentication successful' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/facebook/data-deletion': {
      post: {
        tags: ['Integrations'],
        summary: 'Facebook data deletion callback',
        requestBody: { required: true },
        responses: { '200': { description: 'Deletion receipt' } },
      },
    },
  },
}

export default function ApiDocsPage() {
  const resolvedSpec = useMemo(() => {
    const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return {
      ...spec,
      servers: [{ url: serverUrl, description: 'Current server' }],
    }
  }, [])

  return (
    <Box
      sx={{
        height: '100vh',
        overflow: 'auto',
        backgroundColor: '#FFFFFF',
        color: '#0F1419',
        px: { xs: 1, md: 4 },
        py: { xs: 1, md: 4 },
      }}
    >
      <SwaggerUI spec={resolvedSpec} />
    </Box>
  )
}

