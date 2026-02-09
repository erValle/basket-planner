'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'plan_assignments',
      [
        {
          id: 1,
          trainingPlanId: 1,
          userId: 3,
          assignedById: 2,
          assignedAt: now,
          status: 'assigned',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('plan_assignments', { id: [1] }, {});
  },
};
