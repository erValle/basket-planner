'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'training_plans',
      [
        {
          id: 1,
          createdById: 2,
          targetType: 'individual',
          name: 'Plan Demo 4 semanas',
          description: 'Plan de ejemplo para pruebas',
          goal: 'Mejorar tiro y acondicionamiento',
          type: 'technical',
          intensity: 'medium',
          duration: 4,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('training_plans', { id: [1] }, {});
  },
};
