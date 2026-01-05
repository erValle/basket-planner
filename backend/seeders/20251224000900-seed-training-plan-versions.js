'use strict';


module.exports = {
  async up (queryInterface) {
    const now = new Date();
    const items = [
      { day: 'mon', sessions: [{ name: 'Sesion 1', items: [{ exerciseId: 2, minutes: 15 }, { exerciseId: 1, minutes: 20 }] }] },
      { day: 'wed', sessions: [{ name: 'Sesion 2', items: [{ exerciseId: 1, minutes: 25 }] }] }
    ];

    await queryInterface.bulkInsert('training_plan_versions', [
      {
        id: 1,
        trainingPlanId: 1,
        versionNumber: 1,
        source: 'manual',
        date: now,
        comments: 'Version inicial',
        items: JSON.stringify(items),
        createdFrom: JSON.stringify({
          source: 'seed',
          goals: ['demo'],
          constraints: { days: ['mon', 'wed'] },
          model: { name: 'baseline', version: '0.0.0' },
        }),
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('training_plan_versions', { id: [1] }, {});
  }
};
