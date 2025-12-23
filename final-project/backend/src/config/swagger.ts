import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MeetHalf API',
      version: '1.0.0',
      description: 'MeetHalf Backend API Documentation',
      contact: {
        name: 'MeetHalf Team',
      },
    },
    servers: [
      // Production/Preview server (Vercel automatically provides VERCEL_URL)
      ...(process.env.VERCEL_URL ? [{
        url: process.env.VERCEL_URL.startsWith('http') 
          ? process.env.VERCEL_URL 
          : `https://${process.env.VERCEL_URL}`,
        description: 'Production server',
      }] : []),
      // Development servers
      ...(process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL ? [
        {
          url: 'http://localhost:3000',
          description: 'Local development',
        },
        {
          url: 'http://127.0.0.1:3000',
          description: 'Local development (alternative)',
        },
      ] : []),
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Error code',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Group: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            ownerId: {
              type: 'integer',
              format: 'int64',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            owner: {
              $ref: '#/components/schemas/User',
            },
            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Member',
              },
            },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            userId: {
              type: 'integer',
              format: 'int64',
              nullable: true,
            },
            groupId: {
              type: 'string',
            },
            lat: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            lng: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            address: {
              type: 'string',
              nullable: true,
            },
            travelMode: {
              type: 'string',
              enum: ['driving', 'walking', 'transit', 'bicycling', 'motorcycle'],
            },
            nickname: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            user: {
              $ref: '#/components/schemas/User',
              nullable: true,
            },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            name: {
              type: 'string',
            },
            ownerId: {
              type: 'string',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'ended'],
            },
            useMeetHalf: {
              type: 'boolean',
            },
            meetingPointLat: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            meetingPointLng: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            meetingPointName: {
              type: 'string',
              nullable: true,
            },
            meetingPointAddress: {
              type: 'string',
              nullable: true,
            },
            groupId: {
              type: 'integer',
              format: 'int64',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Member',
              },
            },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            content: {
              type: 'string',
            },
            senderId: {
              type: 'string',
            },
            receiverId: {
              type: 'string',
              nullable: true,
            },
            groupId: {
              type: 'integer',
              format: 'int64',
              nullable: true,
            },
            readBy: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            sender: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                avatar: {
                  type: 'string',
                  nullable: true,
                },
              },
            },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['user', 'group'],
            },
            receiverId: {
              type: 'string',
              nullable: true,
            },
            groupId: {
              type: 'integer',
              format: 'int64',
              nullable: true,
            },
            lastMessage: {
              $ref: '#/components/schemas/ChatMessage',
              nullable: true,
            },
            unreadCount: {
              type: 'integer',
            },
            participant: {
              type: 'object',
              nullable: true,
            },
            group: {
              $ref: '#/components/schemas/Group',
              nullable: true,
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Friend: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            avatar: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        FriendRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            fromUserId: {
              type: 'string',
            },
            toUserId: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            fromUser: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                avatar: {
                  type: 'string',
                  nullable: true,
                },
              },
            },
            toUser: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                avatar: {
                  type: 'string',
                  nullable: true,
                },
              },
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            userId: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['EVENT_INVITE', 'EVENT_UPDATE', 'FRIEND_REQUEST', 'MESSAGE'],
            },
            title: {
              type: 'string',
            },
            body: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
            read: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Events',
        description: 'Event management endpoints',
      },
      {
        name: 'Members',
        description: 'Member management endpoints',
      },
      {
        name: 'Maps',
        description: 'Google Maps API proxy endpoints',
      },
      {
        name: 'Groups',
        description: 'Group management endpoints',
      },
      {
        name: 'Users',
        description: 'User profile and statistics endpoints',
      },
      {
        name: 'Chat',
        description: 'Chat and messaging endpoints',
      },
      {
        name: 'Friends',
        description: 'Friend management endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints',
      },
      {
        name: 'Invites',
        description: 'Event invitation endpoints',
      },
      {
        name: 'Event Invitations',
        description: 'Event invitation management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

