import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';
import { gmapsClient } from '../src/lib/gmaps';

// Mock Google Maps client
vi.mock('../src/lib/gmaps', () => ({
  gmapsClient: {
    reverseGeocode: vi.fn(),
    placesNearby: vi.fn()
  },
  GMAPS_KEY: 'test_key'
}));

describe('Events Routes', () => {
  let agent: request.SuperAgentTest;
  let testUser: any;
  let testUser2: any;
  let authCookie: string;

  beforeAll(async () => {
    agent = request.agent(app);
    
    // Clean up any existing test data
    await prisma.member.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.member.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.user.deleteMany({});
  });

  beforeEach(async () => {
    // Clean up data before each test
    await prisma.member.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const registerRes1 = await agent
      .post('/auth/register')
      .send({
        email: 'test1@example.com',
        password: 'password123'
      });

    const registerRes2 = await agent
      .post('/auth/register')
      .send({
        email: 'test2@example.com',
        password: 'password123'
      });

    // Login as first user
    const loginRes = await agent
      .post('/auth/login')
      .send({
        email: 'test1@example.com',
        password: 'password123'
      });

    testUser = loginRes.body.user;
    authCookie = loginRes.headers['set-cookie'][0];

    // Get second user info
    testUser2 = registerRes2.body.user;
  });

  describe('POST /groups', () => {
    it('should create a new group', async () => {
      const res = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Test Group'
        });

      expect(res.status).toBe(201);
      expect(res.body.group).toBeDefined();
      expect(res.body.group.name).toBe('Test Group');
      expect(res.body.group.ownerId).toBe(testUser.id);
      expect(res.body.group.members).toHaveLength(1);
      expect(res.body.group.members[0].userId).toBe(testUser.id);
    });

    it('should validate group name', async () => {
      const res = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const res = await agent
        .post('/groups')
        .send({
          name: 'Test Group'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /groups', () => {
    it('should list user groups', async () => {
      // Create a group
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Test Group'
        });

      const res = await agent
        .get('/groups')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.groups).toHaveLength(1);
      expect(res.body.groups[0].name).toBe('Test Group');
    });

    it('should only show groups where user is a member', async () => {
      // Create a group as user1
      await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'User1 Group'
        });

      // Login as user2
      const loginRes2 = await agent
        .post('/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'password123'
        });

      const authCookie2 = loginRes2.headers['set-cookie'][0];

      // User2 should not see user1's group
      const res = await agent
        .get('/groups')
        .set('Cookie', authCookie2);

      expect(res.status).toBe(200);
      expect(res.body.groups).toHaveLength(0);
    });
  });

  describe('GET /groups/:id', () => {
    it('should get group details', async () => {
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Test Group'
        });

      const groupId = createRes.body.group.id;

      const res = await agent
        .get(`/groups/${groupId}`)
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.group.id).toBe(groupId);
      expect(res.body.group.name).toBe('Test Group');
      expect(res.body.group.members).toHaveLength(1);
    });

    it('should return 404 for non-existent group', async () => {
      const res = await agent
        .get('/groups/999999')
        .set('Cookie', authCookie);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('GROUP_NOT_FOUND');
    });

    it('should deny access to groups user is not a member of', async () => {
      // Create group as user1
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Private Group'
        });

      const groupId = createRes.body.group.id;

      // Login as user2
      const loginRes2 = await agent
        .post('/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'password123'
        });

      const authCookie2 = loginRes2.headers['set-cookie'][0];

      // User2 should not access user1's group
      const res = await agent
        .get(`/groups/${groupId}`)
        .set('Cookie', authCookie2);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('GROUP_NOT_FOUND');
    });
  });

  describe('PATCH /groups/:id', () => {
    it('should update group name (owner only)', async () => {
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Original Name'
        });

      const groupId = createRes.body.group.id;

      const res = await agent
        .patch(`/groups/${groupId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.group.name).toBe('Updated Name');
    });

    it('should deny non-owners from updating', async () => {
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Test Group'
        });

      const groupId = createRes.body.group.id;

      // Login as user2
      const loginRes2 = await agent
        .post('/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'password123'
        });

      const authCookie2 = loginRes2.headers['set-cookie'][0];

      const res = await agent
        .patch(`/groups/${groupId}`)
        .set('Cookie', authCookie2)
        .send({
          name: 'Hacked Name'
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('GROUP_NOT_FOUND');
    });
  });

  describe('DELETE /groups/:id', () => {
    it('should delete group (owner only)', async () => {
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'To Delete'
        });

      const groupId = createRes.body.group.id;

      const res = await agent
        .delete(`/groups/${groupId}`)
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Group deleted successfully');

      // Verify group is deleted
      const getRes = await agent
        .get(`/groups/${groupId}`)
        .set('Cookie', authCookie);

      expect(getRes.status).toBe(404);
    });

    it('should deny non-owners from deleting', async () => {
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Protected Group'
        });

      const groupId = createRes.body.group.id;

      // Login as user2
      const loginRes2 = await agent
        .post('/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'password123'
        });

      const authCookie2 = loginRes2.headers['set-cookie'][0];

      const res = await agent
        .delete(`/groups/${groupId}`)
        .set('Cookie', authCookie2);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('GROUP_NOT_FOUND');
    });
  });

  describe('GET /groups/:id/midpoint', () => {
    it('should calculate midpoint with sufficient locations', async () => {
      // Mock Google Maps responses
      vi.mocked(gmapsClient.reverseGeocode).mockResolvedValue({
        data: {
          status: 'OK',
          results: [
            {
              formatted_address: 'Test Address, Test City'
            }
          ]
        }
      } as any);

      vi.mocked(gmapsClient.placesNearby).mockResolvedValue({
        data: {
          status: 'OK',
          results: [
            {
              name: 'Test Restaurant',
              vicinity: 'Test Area',
              rating: 4.5,
              types: ['restaurant'],
              place_id: 'test_place_id'
            }
          ]
        }
      } as any);

      // Create group
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Midpoint Test Group'
        });

      const groupId = createRes.body.group.id;

      // Add member with location
      await agent
        .post('/members')
        .set('Cookie', authCookie)
        .send({
          userId: testUser2.id,
          groupId: groupId,
          lat: 25.0,
          lng: 121.5
        });

      // Update current user's location
      const memberRes = await agent
        .get(`/groups/${groupId}`)
        .set('Cookie', authCookie);

      const currentUserMemberId = memberRes.body.group.members.find((m: any) => m.userId === testUser.id).id;

      await agent
        .patch(`/members/${currentUserMemberId}`)
        .set('Cookie', authCookie)
        .send({
          lat: 25.1,
          lng: 121.6
        });

      // Calculate midpoint
      const res = await agent
        .get(`/groups/${groupId}/midpoint`)
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.midpoint).toBeDefined();
      expect(res.body.midpoint.lat).toBe(25.05);
      expect(res.body.midpoint.lng).toBe(121.55);
      expect(res.body.address).toBe('Test Address, Test City');
      expect(res.body.suggested_places).toHaveLength(1);
      expect(res.body.member_count).toBe(2);
      expect(res.body.cached).toBe(false);
    });

    it('should require at least 2 locations', async () => {
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Single Member Group'
        });

      const groupId = createRes.body.group.id;

      const res = await agent
        .get(`/groups/${groupId}/midpoint`)
        .set('Cookie', authCookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_LOCATIONS');
    });

    it('should use cache for repeated requests', async () => {
      // Mock Google Maps responses
      vi.mocked(gmapsClient.reverseGeocode).mockResolvedValue({
        data: {
          status: 'OK',
          results: [{ formatted_address: 'Cached Address' }]
        }
      } as any);

      vi.mocked(gmapsClient.placesNearby).mockResolvedValue({
        data: {
          status: 'OK',
          results: []
        }
      } as any);

      // Create group with 2 members with locations
      const createRes = await agent
        .post('/groups')
        .set('Cookie', authCookie)
        .send({
          name: 'Cache Test Group'
        });

      const groupId = createRes.body.group.id;

      // Add member with location
      await agent
        .post('/members')
        .set('Cookie', authCookie)
        .send({
          userId: testUser2.id,
          groupId: groupId,
          lat: 25.0,
          lng: 121.5
        });

      // Update current user's location
      const memberRes = await agent
        .get(`/groups/${groupId}`)
        .set('Cookie', authCookie);

      const currentUserMemberId = memberRes.body.group.members.find((m: any) => m.userId === testUser.id).id;

      await agent
        .patch(`/members/${currentUserMemberId}`)
        .set('Cookie', authCookie)
        .send({
          lat: 25.1,
          lng: 121.6
        });

      // First request
      const res1 = await agent
        .get(`/groups/${groupId}/midpoint`)
        .set('Cookie', authCookie);

      expect(res1.status).toBe(200);
      expect(res1.body.cached).toBe(false);

      // Second request should be cached
      const res2 = await agent
        .get(`/groups/${groupId}/midpoint`)
        .set('Cookie', authCookie);

      expect(res2.status).toBe(200);
      expect(res2.body.cached).toBe(true);
      expect(res2.body.midpoint).toEqual(res1.body.midpoint);
    });
  });
});
