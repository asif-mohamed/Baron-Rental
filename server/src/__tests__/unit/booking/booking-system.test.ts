import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../lib/prisma';

describe('Booking System - Availability & Overlap Prevention', () => {
  let authToken: string;
  let testCarId: string;
  let testCustomerId: string;
  let testBookingId: string;

  beforeAll(async () => {
    // Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@baron.local',
        password: 'Admin123!',
      });

    authToken = loginResponse.body.token;

    // Create test car
    const carResponse = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        plateNumber: 'TEST-001',
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'White',
        type: 'sedan',
        dailyRate: 150,
        status: 'available',
      });

    testCarId = carResponse.body.car.id;

    // Create test customer
    const customerResponse = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Customer',
        phone: '0500111222',
        idNumber: 'TEST123456',
        email: 'test-customer@example.com',
      });

    testCustomerId = customerResponse.body.customer.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testBookingId) {
      await prisma.booking.delete({ where: { id: testBookingId } }).catch(() => {});
    }
    if (testCustomerId) {
      await prisma.customer.delete({ where: { id: testCustomerId } }).catch(() => {});
    }
    if (testCarId) {
      await prisma.car.delete({ where: { id: testCarId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('POST /api/bookings/check-availability', () => {
    it('should return available car for valid date range', async () => {
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

      const response = await request(app)
        .post('/api/bookings/check-availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          carId: testCarId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body.available).toBe(true);
    });

    it('should reject booking with end date before start date', async () => {
      const startDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await request(app)
        .post('/api/bookings/check-availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          carId: testCarId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(400);
    });
  });

  describe('POST /api/bookings', () => {
    it('should create booking with automatic price calculation', async () => {
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const days = 3;
      const expectedPrice = 150 * days; // dailyRate * days

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          carId: testCarId,
          customerId: testCustomerId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deposit: 100,
        })
        .expect(201);

      expect(response.body.booking).toHaveProperty('id');
      expect(response.body.booking.totalPrice).toBe(expectedPrice);
      expect(response.body.booking.status).toBe('pending');

      testBookingId = response.body.booking.id;
    });

    it('should prevent overlapping bookings for same car', async () => {
      // Try to create booking with overlapping dates
      const startDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000);

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          carId: testCarId,
          customerId: testCustomerId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(409); // Conflict
    });

    it('should calculate price with extras and discount', async () => {
      // Create another car for this test
      const car2Response = await request(app)
        .post('/api/cars')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plateNumber: 'TEST-002',
          brand: 'Honda',
          model: 'Accord',
          year: 2023,
          color: 'Black',
          type: 'sedan',
          dailyRate: 200,
          status: 'available',
        });

      const car2Id = car2Response.body.car.id;

      const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 17 * 24 * 60 * 60 * 1000);
      const days = 3;
      const expectedPrice = 200 * days + 50 - 20; // (dailyRate * days) + extras - discount

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          carId: car2Id,
          customerId: testCustomerId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          extras: 50,
          discount: 20,
        })
        .expect(201);

      expect(response.body.booking.totalPrice).toBe(expectedPrice);

      // Cleanup
      await prisma.booking.delete({ where: { id: response.body.booking.id } });
      await prisma.car.delete({ where: { id: car2Id } });
    });
  });

  describe('PATCH /api/bookings/:id/pickup', () => {
    it('should mark booking as picked up and update car status', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${testBookingId}/pickup`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mileageOut: 50000,
        })
        .expect(200);

      expect(response.body.booking.status).toBe('active');
      expect(response.body.booking.mileageOut).toBe(50000);

      // Verify car status changed to 'rented'
      const car = await prisma.car.findUnique({ where: { id: testCarId } });
      expect(car?.status).toBe('rented');
    });
  });

  describe('PATCH /api/bookings/:id/return', () => {
    it('should mark booking as completed and update car status back to available', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${testBookingId}/return`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mileageIn: 50300,
          fuelLevel: 'full',
          condition: 'good',
        })
        .expect(200);

      expect(response.body.booking.status).toBe('completed');
      expect(response.body.booking.mileageIn).toBe(50300);

      // Verify car status changed back to 'available'
      const car = await prisma.car.findUnique({ where: { id: testCarId } });
      expect(car?.status).toBe('available');
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    it('should cancel booking and free up the car', async () => {
      // Create a new booking to cancel
      const startDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 24 * 24 * 60 * 60 * 1000);

      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          carId: testCarId,
          customerId: testCustomerId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      const bookingId = bookingResponse.body.booking.id;

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Customer request',
        })
        .expect(200);

      expect(response.body.booking.status).toBe('cancelled');

      // Cleanup
      await prisma.booking.delete({ where: { id: bookingId } });
    });
  });
});
