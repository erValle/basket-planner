'use strict';


module.exports = {
  async up (queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('feedbacks', [
      {
        id: 1,
        trainingPlanVersionId: 1,
        userId: 3,
        rating: JSON.stringify({ effortTechnical: 7, effortPhysical: 8, effortMental: 6 }),
        comments: 'Buena sesión, algo exigente',
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('feedbacks', { id: [1] }, {});
  }
};
