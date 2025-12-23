import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';

describe('Members Routes', () => {
  let agent: request.SuperAgentTest;
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let authCookie1: string;
  let authCookie2: string;
  let testGroup: any;

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
        email: 'user1@example.com',
        password: 'password123'
      });

    const registerRes2 = await agent
      .post('/auth/register')
      .send({
        email: 'user2@example.com',
        password: 'password123'
      });

    const registerRes3 = await agent
      .post('/auth/register')
      .send({
        email: 'user3@example.com',
        password: 'password123'
      });

    testUser1 = registerRes1.body.user;
    testUser2 = registerRes2.body.user;
    testUser3 = registerRes3.body.user;

    // Login as user1
    const loginRes1 = await agent
      .post('/auth/login')
      .send({
        email: 'user1@example.com',
        password: 'password123'
      });

    authCookie1 = loginRes1.headers['set-cookie'][0];

    // Login as user2
    const loginRes2 = await agent
      .post('/auth/login')
      .send({
        email: 'user2@example.com',
        password: 'password123'
      });

    authCookie2 = loginRes2.headers['set-cookie'][0];

    // Create a test group as user1
    const groupRes = await agent
      .post('/groups')
      .set('Cookie', authCookie1)
      .send({
        name: 'Test Group'
      });

    testGroup = groupRes.body.group;
  });

  describe('POST /members', () => {
    it('should add a member to group', async () => {
      const res = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: testUser2.id,
          groupId: testGroup.id,
          lat: 25.033,
          lng: 121.565,
          address: 'Taipei 101'
        });

      expect(res.status).toBe(201);
      expect(res.body.member).toBeDefined();
      expect(res.body.member.userId).toBe(testUser2.id);
      expect(res.body.member.groupId).toBe(testGroup.id);
      expect(res.body.member.lat).toBe(25.033);
      expect(res.body.member.lng).toBe(121.565);
      expect(res.body.member.address).toBe('Taipei 101');
    });

    it('should add member without location', async () => {
      const res = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: testUser2.id,
          groupId: testGroup.id
        });

      expect(res.status).toBe(201);
      expect(res.body.member.lat).toBeNull();
      expect(res.body.member.lng).toBeNull();
      expect(res.body.member.address).toBeNull();
    });

    it('should prevent duplicate memberships', async () => {
      // Add member first time
      await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: testUser2.id,
          groupId: testGroup.id
        });

      // Try to add same member again
      const res = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: testUser2.id,
          groupId: testGroup.id
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('MEMBER_EXISTS');
    });

    it('should require group membership to add others', async () => {
      // User2 tries to add user3 to user1's group (user2 is not a member)
      const res = await agent
        .post('/members')
        .set('Cookie', authCookie2)
        .send({
          userId: testUser3.id,
          groupId: testGroup.id
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCESS_DENIED');
    });

    it('should validate user exists', async () => {
      const res = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: 999999,
          groupId: testGroup.id
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });

    it('should validate input data', async () => {
      const res = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: 'invalid',
          groupId: testGroup.id,
          lat: 'invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const res = await agent
        .post('/members')
        .send({
          userId: testUser2.id,
          groupId: testGroup.id
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /members/:id', () => {
    let memberToUpdate: any;

    beforeEach(async () => {
      // Add user2 to the group
      const addRes = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: testUser2.id,
          groupId: testGroup.id
        });

      memberToUpdate = addRes.body.member;
    });

    it('should update member location', async () => {
      const res = await agent
        .patch(`/members/${memberToUpdate.id}`)
        .set('Cookie', authCookie2) // User2 updating their own location
        .send({
          lat: 25.047,
          lng: 121.517,
          address: 'Taipei Main Station'
        });

      expect(res.status).toBe(200);
      expect(res.body.member.lat).toBe(25.047);
      expect(res.body.member.lng).toBe(121.517);
      expect(res.body.member.address).toBe('Taipei Main Station');
    });

    it('should allow partial updates', async () => {
      const res = await agent
        .patch(`/members/${memberToUpdate.id}`)
        .set('Cookie', authCookie2)
        .send({
          lat: 25.047
        });

      expect(res.status).toBe(200);
      expect(res.body.member.lat).toBe(25.047);
      expect(res.body.member.lng).toBeNull();
    });

    it('should only allow users to update their own location', async () => {
      // User1 tries to update user2's location
      const res = await agent
        .patch(`/members/${memberToUpdate.id}`)
        .set('Cookie', authCookie1)
        .send({
          lat: 25.047,
          lng: 121.517
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('MEMBER_NOT_FOUND');
    });

    it('should validate location coordinates', async () => {
      const res = await agent
        .patch(`/members/${memberToUpdate.id}`)
        .set('Cookie', authCookie2)
        .send({
          lat: 91, // Invalid latitude
          lng: 181 // Invalid longitude
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent member', async () => {
      const res = await agent
        .patch('/members/999999')
        .set('Cookie', authCookie2)
        .send({
          lat: 25.047
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('MEMBER_NOT_FOUND');
    });
  });

  describe('DELETE /members/:id', () => {
    let memberToDelete: any;

    beforeEach(async () => {
      // Add user2 to the group
      const addRes = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: testUser2.id,
          groupId: testGroup.id
        });

      memberToDelete = addRes.body.member;
    });

    it('should allow user to remove themselves', async () => {
      const res = await agent
        .delete(`/members/${memberToDelete.id}`)
        .set('Cookie', authCookie2); // User2 removing themselves

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Member removed successfully');

      // Verify member is removed
      const groupRes = await agent
        .get(`/groups/${testGroup.id}`)
        .set('Cookie', authCookie1);

      expect(groupRes.body.group.members).toHaveLength(1); // Only owner remains
    });

    it('should allow group owner to remove members', async () => {
      const res = await agent
        .delete(`/members/${memberToDelete.id}`)
        .set('Cookie', authCookie1); // Owner removing user2

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Member removed successfully');
    });

    it('should prevent non-owners from removing others', async () => {
      // Add user3 to the group
      const addRes = await agent
        .post('/members')
        .set('Cookie', authCookie1)
        .send({
          userId: testUser3.id,
          groupId: testGroup.id
        });

      const user3Member = addRes.body.member;

      // User2 tries to remove user3 (neither is owner)
      const res = await agent
        .delete(`/members/${user3Member.id}`)
        .set('Cookie', authCookie2);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCESS_DENIED');
    });

    it('should prevent owner from leaving if other members exist', async () => {
      // Get the owner's membership
      const groupRes = await agent
        .get(`/groups/${testGroup.id}`)
        .set('Cookie', authCookie1);

      const ownerMember = groupRes.body.group.members.find((m: any) => m.userId === testUser1.id);

      const res = await agent
        .delete(`/members/${ownerMember.id}`)
        .set('Cookie', authCookie1);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OWNER_CANNOT_LEAVE');
    });

    it('should allow owner to leave if they are the only member', async () => {
      // Remove user2 first
      await agent
        .delete(`/members/${memberToDelete.id}`)
        .set('Cookie', authCookie1);

      // Now owner can leave
      const groupRes = await agent
        .get(`/groups/${testGroup.id}`)
        .set('Cookie', authCookie1);

      const ownerMember = groupRes.body.group.members.find((m: any) => m.userId === testUser1.id);

      const res = await agent
        .delete(`/members/${ownerMember.id}`)
        .set('Cookie', authCookie1);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Member removed successfully');
    });

    it('should return 404 for non-existent member', async () => {
      const res = await agent
        .delete('/members/999999')
        .set('Cookie', authCookie1);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('MEMBER_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const res = await agent
        .delete(`/members/${memberToDelete.id}`);

      expect(res.status).toBe(401);
    });
  });
});
