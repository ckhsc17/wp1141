'use client'

import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with swagger-ui-react
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Twitter Clone API',
      version: '1.0.0',
      description: 'A Twitter/X clone social media API built with Next.js',
    },
    servers: [
      {
        url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        description: 'Current server',
      },
    ],
    paths: {
      '/api/posts': {
        get: {
          summary: 'Get all posts',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': { description: 'List of posts' },
          },
        },
        post: {
          summary: 'Create a post',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string', maxLength: 280 },
                  },
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
      '/api/posts/{id}': {
        get: {
          summary: 'Get post by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Post details' },
            '404': { description: 'Not found' },
          },
        },
      },
      '/api/posts/{id}/like': {
        post: {
          summary: 'Toggle like on post',
          responses: {
            '200': { description: 'Like toggled' },
          },
        },
      },
      '/api/posts/{id}/comments': {
        get: {
          summary: 'Get post comments',
          responses: {
            '200': { description: 'List of comments' },
          },
        },
        post: {
          summary: 'Create comment',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string', maxLength: 280 },
                  },
                  required: ['content'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Comment created' },
          },
        },
      },
      '/api/users/{userId}': {
        get: {
          summary: 'Get user by userId',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'User details' },
            '404': { description: 'Not found' },
          },
        },
      },
      '/api/users/{userId}/posts': {
        get: {
          summary: 'Get user posts',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': { description: 'List of posts' },
          },
        },
      },
      '/api/comments/{id}': {
        get: {
          summary: 'Get comment by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Comment details' },
            '404': { description: 'Not found' },
          },
        },
        delete: {
          summary: 'Delete comment',
          responses: {
            '200': { description: 'Comment deleted' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Not found' },
          },
        },
      },
      '/api/comments/{id}/replies': {
        get: {
          summary: 'Get comment replies',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'List of replies' },
            '404': { description: 'Comment not found' },
          },
        },
        post: {
          summary: 'Create reply to comment',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string', maxLength: 280 },
                  },
                  required: ['content'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Reply created' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Parent comment not found' },
          },
        },
      },
      '/api/draft': {
        get: {
          summary: 'Get user draft',
          responses: {
            '200': { description: 'User draft data' },
            '401': { description: 'Unauthorized' },
          },
        },
        post: {
          summary: 'Save or update user draft',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string', maxLength: 280 },
                  },
                  required: ['content'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Draft saved' },
            '401': { description: 'Unauthorized' },
          },
        },
        delete: {
          summary: 'Delete user draft',
          responses: {
            '200': { description: 'Draft deleted' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Draft not found' },
          },
        },
      },
      '/api/users/search': {
        get: {
          summary: 'Search users',
          parameters: [
            { name: 'q', in: 'query', required: true, description: 'Search query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            '200': { description: 'List of matching users' },
          },
        },
      },
      '/api/mentions': {
        get: {
          summary: 'Get user mentions',
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
          summary: 'Mark all mentions as read',
          responses: {
            '200': { description: 'All mentions marked as read' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/api/mentions/{id}': {
        put: {
          summary: 'Mark mention as read',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Mention marked as read' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Mention not found' },
          },
        },
      },
      '/api/mentions/unread': {
        get: {
          summary: 'Get unread mention count',
          responses: {
            '200': { description: 'Unread mention count' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/api/users/{userId}/follow': {
        get: {
          summary: 'Check follow status',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Follow status' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'User not found' },
          },
        },
        post: {
          summary: 'Toggle follow/unfollow',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Follow toggled' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'User not found' },
          },
        },
      },
    },
  }

  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI spec={spec} />
    </div>
  )
}

