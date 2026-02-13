'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'equipment',
      [
        {
          id: 1,
          clubId: 1,
          name: 'Conos',
          quantity: 20,
          characteristics: JSON.stringify(['pack']),
          status: 'available',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          clubId: 1,
          name: 'Balones',
          quantity: 12,
          characteristics: JSON.stringify(['oficial']),
          status: 'available',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('equipment', { name: ['Conos', 'Balones'] }, {});
  },
};
