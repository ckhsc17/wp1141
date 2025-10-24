import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Treasure Map API',
      version: '1.0.0',
      description: 'A comprehensive treasure map application API with location-based treasure discovery',
      contact: {
        name: 'API Support',
        email: 'support@treasuremap.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:8000',
        description: 'Development server'
      },
      {
        url: 'https://api.treasuremap.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              pattern: '^c[a-z0-9]{24,}$',
              description: 'Unique user identifier (CUID format)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User display name'
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL',
              nullable: true
            }
          },
          required: ['id', 'email', 'name']
        },
        UserDTO: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              pattern: '^c[a-z0-9]{24,}$',
              description: 'Unique user identifier (CUID format)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User display name'
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL',
              nullable: true
            }
          },
          required: ['id', 'email', 'name']
        },
        TreasureType: {
          type: 'string',
          enum: ['music', 'audio', 'text', 'link', 'live_moment'],
          description: 'Type of treasure content'
        },
        Treasure: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              pattern: '^c[a-z0-9]{24,}$',
              description: 'Unique treasure identifier (CUID format)'
            },
            title: {
              type: 'string',
              description: 'Treasure title'
            },
            content: {
              type: 'string',
              description: 'Treasure content or description'
            },
            type: {
              $ref: '#/components/schemas/TreasureType'
            },
            latitude: {
              type: 'number',
              format: 'double',
              minimum: -90,
              maximum: 90,
              description: 'Geographic latitude'
            },
            longitude: {
              type: 'number',
              format: 'double',
              minimum: -180,
              maximum: 180,
              description: 'Geographic longitude'
            },
            address: {
              type: 'string',
              description: 'Human-readable address',
              nullable: true
            },
            amount: {
              type: 'string',
              description: 'Amount or price information',
              nullable: true
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether this is a public life moment',
              nullable: true
            },
            isHidden: {
              type: 'boolean',
              description: 'Whether this treasure is hidden until discovered',
              nullable: true
            },
            mediaUrl: {
              type: 'string',
              format: 'uri',
              description: 'Media file URL',
              nullable: true
            },
            linkUrl: {
              type: 'string',
              format: 'uri',
              description: 'External link URL',
              nullable: true
            },
            isLiveLocation: {
              type: 'boolean',
              description: 'Whether the treasure is at a live location'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Treasure tags for categorization'
            },
            likesCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of likes'
            },
            commentsCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of comments'
            },
            isLiked: {
              type: 'boolean',
              description: 'Whether current user has liked this treasure'
            },
            isFavorited: {
              type: 'boolean',
              description: 'Whether current user has favorited this treasure'
            },
            isCollected: {
              type: 'boolean',
              description: 'Whether current user has collected this treasure'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          },
          required: ['id', 'title', 'content', 'type', 'latitude', 'longitude', 'isLiveLocation', 'tags', 'likesCount', 'commentsCount', 'isLiked', 'isFavorited', 'isCollected', 'createdAt', 'user']
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              pattern: '^c[a-z0-9]{24,}$',
              description: 'Unique comment identifier (CUID format)'
            },
            content: {
              type: 'string',
              description: 'Comment content'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          },
          required: ['id', 'content', 'createdAt', 'user']
        },
        CommentDTO: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              pattern: '^c[a-z0-9]{24,}$',
              description: 'Unique comment identifier (CUID format)'
            },
            content: {
              type: 'string',
              description: 'Comment content'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp (ISO string)'
            },
            user: {
              $ref: '#/components/schemas/UserDTO'
            }
          },
          required: ['id', 'content', 'createdAt', 'user']
        },
        CreateCommentDTO: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Comment content'
            }
          },
          required: ['content']
        },
        CollectDTO: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              pattern: '^c[a-z0-9]{24,}$',
              description: 'Unique collect identifier (CUID format)'
            },
            treasureId: {
              type: 'string',
              pattern: '^c[a-z0-9]{24,}$',
              description: 'ID of the collected treasure'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Collection timestamp (ISO string)'
            },
            isLocked: {
              type: 'boolean',
              description: 'Whether the collected treasure is locked'
            },
            treasure: {
              $ref: '#/components/schemas/TreasureDTO'
            }
          },
          required: ['id', 'treasureId', 'createdAt', 'isLocked', 'treasure']
        },
        CreateTreasure: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Treasure title'
            },
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 2000,
              description: 'Treasure content'
            },
            type: {
              $ref: '#/components/schemas/TreasureType'
            },
            latitude: {
              type: 'number',
              format: 'double',
              minimum: -90,
              maximum: 90,
              description: 'Geographic latitude'
            },
            longitude: {
              type: 'number',
              format: 'double',
              minimum: -180,
              maximum: 180,
              description: 'Geographic longitude'
            },
            address: {
              type: 'string',
              maxLength: 500,
              description: 'Human-readable address',
              nullable: true
            },
            amount: {
              type: 'string',
              maxLength: 100,
              description: 'Amount or price information',
              nullable: true
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether this is a public life moment (for life_moment mode)',
              nullable: true
            },
            isHidden: {
              type: 'boolean',
              description: 'Whether this treasure is hidden until discovered (for treasure mode)',
              nullable: true
            },
            linkUrl: {
              type: 'string',
              format: 'uri',
              description: 'External link URL',
              nullable: true
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 50
              },
              maxItems: 10,
              description: 'Treasure tags'
            },
            isLiveLocation: {
              type: 'boolean',
              description: 'Whether this is a live location treasure',
              default: false
            }
          },
          required: ['title', 'content', 'type', 'latitude', 'longitude', 'tags']
        },
        UpdateTreasure: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Treasure title'
            },
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 2000,
              description: 'Treasure content'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 50
              },
              maxItems: 10,
              description: 'Treasure tags'
            },
            linkUrl: {
              type: 'string',
              format: 'uri',
              description: 'External link URL',
              nullable: true
            },
            amount: {
              type: 'string',
              maxLength: 100,
              description: 'Amount or price information',
              nullable: true
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether this is a public life moment',
              nullable: true
            },
            isHidden: {
              type: 'boolean',
              description: 'Whether this treasure is hidden until discovered',
              nullable: true
            }
          }
        },
        CreateComment: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Comment content'
            }
          },
          required: ['content']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            googleToken: {
              type: 'string',
              description: 'Google OAuth token'
            }
          },
          required: ['googleToken']
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            accessToken: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            }
          },
          required: ['user', 'accessToken', 'refreshToken']
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Optional success message'
            }
          },
          required: ['success', 'data']
        },
        ApiError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                }
              },
              required: ['code', 'message']
            }
          },
          required: ['success', 'error']
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Array of response data'
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Current page number'
                },
                limit: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  description: 'Items per page'
                },
                total: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of items'
                },
                totalPages: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of pages'
                }
              },
              required: ['page', 'limit', 'total', 'totalPages']
            }
          },
          required: ['success', 'data', 'pagination']
        },
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;