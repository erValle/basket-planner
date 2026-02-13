/**
 * Unit tests for trainingPlanService
 */

// Mock models
jest.mock('../../../models', () => ({
  TrainingPlan: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  TrainingPlanVersion: {},
}));

// Mock auditLogService
jest.mock('../../../src/services/auditLogService', () => ({
  createAuditLog: jest.fn(),
}));

const { TrainingPlan } = require('../../../models');
const auditLogService = require('../../../src/services/auditLogService');
const trainingPlanService = require('../../../src/services/trainingPlanService');

describe('trainingPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTrainingPlans', () => {
    it('lists all training plans without filters', async () => {
      const mockPlans = [
        { id: 1, name: 'Plan 1' },
        { id: 2, name: 'Plan 2' },
      ];
      TrainingPlan.findAll.mockResolvedValue(mockPlans);

      const result = await trainingPlanService.listTrainingPlans();

      expect(TrainingPlan.findAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        order: [['id', 'DESC']],
      });
      expect(result).toEqual(mockPlans);
    });

    it('filters by createdById', async () => {
      TrainingPlan.findAll.mockResolvedValue([]);

      await trainingPlanService.listTrainingPlans({ createdById: 1 });

      expect(TrainingPlan.findAll).toHaveBeenCalledWith({
        where: { createdById: 1 },
        include: expect.any(Array),
        order: [['id', 'DESC']],
      });
    });

    it('filters by targetType', async () => {
      TrainingPlan.findAll.mockResolvedValue([]);

      await trainingPlanService.listTrainingPlans({ targetType: 'team' });

      expect(TrainingPlan.findAll).toHaveBeenCalledWith({
        where: { targetType: 'team' },
        include: expect.any(Array),
        order: [['id', 'DESC']],
      });
    });

    it('filters by status', async () => {
      TrainingPlan.findAll.mockResolvedValue([]);

      await trainingPlanService.listTrainingPlans({ status: 'active' });

      expect(TrainingPlan.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
        include: expect.any(Array),
        order: [['id', 'DESC']],
      });
    });

    it('filters by multiple criteria', async () => {
      TrainingPlan.findAll.mockResolvedValue([]);

      await trainingPlanService.listTrainingPlans({
        createdById: 1,
        targetType: 'individual',
        status: 'draft',
      });

      expect(TrainingPlan.findAll).toHaveBeenCalledWith({
        where: { createdById: 1, targetType: 'individual', status: 'draft' },
        include: expect.any(Array),
        order: [['id', 'DESC']],
      });
    });
  });

  describe('getTrainingPlanById', () => {
    it('returns training plan when found', async () => {
      const mockPlan = { id: 1, name: 'Test Plan' };
      TrainingPlan.findByPk.mockResolvedValue(mockPlan);

      const result = await trainingPlanService.getTrainingPlanById(1);

      expect(TrainingPlan.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(mockPlan);
    });

    it('throws 404 error when not found', async () => {
      TrainingPlan.findByPk.mockResolvedValue(null);

      await expect(trainingPlanService.getTrainingPlanById(999)).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('createTrainingPlan', () => {
    it('creates training plan and logs audit', async () => {
      const payload = { name: 'New Plan', targetType: 'team', status: 'draft' };
      const createdPlan = { id: 1, ...payload };
      TrainingPlan.create.mockResolvedValue(createdPlan);
      auditLogService.createAuditLog.mockResolvedValue({});

      const auditCtx = { user: { id: 1 }, requestId: 'req-123' };
      const result = await trainingPlanService.createTrainingPlan(payload, auditCtx);

      expect(TrainingPlan.create).toHaveBeenCalledWith(payload);
      expect(auditLogService.createAuditLog).toHaveBeenCalledWith({
        user: { id: 1 },
        requestId: 'req-123',
        action: 'training_plan.created',
        entity: 'TrainingPlan',
        entityId: 1,
        metadata: expect.any(Object),
      });
      expect(result).toEqual(createdPlan);
    });

    it('creates training plan without audit context', async () => {
      const payload = { name: 'New Plan' };
      const createdPlan = { id: 1, ...payload };
      TrainingPlan.create.mockResolvedValue(createdPlan);
      auditLogService.createAuditLog.mockResolvedValue({});

      const result = await trainingPlanService.createTrainingPlan(payload);

      expect(TrainingPlan.create).toHaveBeenCalled();
      expect(result).toEqual(createdPlan);
    });
  });

  describe('updateTrainingPlan', () => {
    it('updates training plan and logs audit', async () => {
      const mockPlan = {
        id: 1,
        name: 'Old Name',
        status: 'draft',
        targetType: 'team',
        createdById: 1,
        update: jest.fn(),
      };
      TrainingPlan.findByPk.mockResolvedValue(mockPlan);
      auditLogService.createAuditLog.mockResolvedValue({});

      const payload = { name: 'Updated Name' };
      const auditCtx = { user: { id: 1 }, requestId: 'req-456' };

      await trainingPlanService.updateTrainingPlan(1, payload, auditCtx);

      expect(mockPlan.update).toHaveBeenCalledWith(payload);
      expect(auditLogService.createAuditLog).toHaveBeenCalledWith({
        user: { id: 1 },
        requestId: 'req-456',
        action: 'training_plan.updated',
        entity: 'TrainingPlan',
        entityId: 1,
        metadata: expect.any(Object),
      });
    });

    it('throws 404 error when plan not found', async () => {
      TrainingPlan.findByPk.mockResolvedValue(null);

      await expect(
        trainingPlanService.updateTrainingPlan(999, { name: 'Test' })
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('deleteTrainingPlan', () => {
    it('deletes training plan successfully', async () => {
      const mockPlan = {
        id: 1,
        destroy: jest.fn(),
      };
      TrainingPlan.findByPk.mockResolvedValue(mockPlan);

      await trainingPlanService.deleteTrainingPlan(1);

      expect(mockPlan.destroy).toHaveBeenCalled();
    });

    it('throws 404 error when plan not found', async () => {
      TrainingPlan.findByPk.mockResolvedValue(null);

      await expect(trainingPlanService.deleteTrainingPlan(999)).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
