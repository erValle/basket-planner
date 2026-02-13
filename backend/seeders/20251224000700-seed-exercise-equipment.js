'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'exercise_equipment',
      [
        { exerciseId: 1, equipmentId: 1, quantity: 10, createdAt: now, updatedAt: now },
        { exerciseId: 2, equipmentId: 2, quantity: 5, createdAt: now, updatedAt: now },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('exercise_equipment', null, {});
  },
};
