import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../lib/prisma';

describe('Authentication System', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Clear test database
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test-user@baron.test',
          password: 'TestPass123!',
          phone: '0500123456',
          roleId: 1, // Admin role
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test-user@baron.test');
      expect(response.body.user).not.toHaveProperty('password');

      testUserId = response.body.user.id;
      authToken = response.body.token;
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'test-user@baron.test',
          password: 'TestPass123!',
          phone: '0500123457',
          roleId: 1,
        })
        .expect(400);
    });

    it('should reject weak password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password User',
          email: 'test-weak@baron.test',
          password: '123',
          phone: '0500123458',
          roleId: 1,
        })
        .expect(400);
    });

    it('should reject invalid email format', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'TestPass123!',
          phone: '0500123459',
          roleId: 1,
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-user@baron.test',
          password: 'TestPass123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test-user@baron.test');
    });

    it('should reject incorrect password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-user@baron.test',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@baron.test',
          password: 'TestPass123!',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('test-user@baron.test');
      expect(response.body).toHaveProperty('role');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
