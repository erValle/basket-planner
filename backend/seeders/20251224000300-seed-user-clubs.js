'use strict';


module.exports = {
  async up (queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('user_clubs', [
      { id: 1, userId: 2, clubId: 1, isPrimary: true, startDate: new Date('2025-01-01'), endDate: null, createdAt: now, updatedAt: now },
      { id: 2, userId: 3, clubId: 1, isPrimary: true, startDate: new Date('2025-01-01'), endDate: null, createdAt: now, updatedAt: now },
      { id: 3, userId: 4, clubId: 1, isPrimary: true, startDate: new Date('2025-01-01'), endDate: null, createdAt: now, updatedAt: now }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('user_clubs', { id: [1,2,3] }, {});
  }
};
