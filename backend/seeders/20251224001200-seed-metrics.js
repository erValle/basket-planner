'use strict';


module.exports = {
  async up (queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('metrics', [
      { id: 1, timestamp: now, cpuUsage: 0.25, memoryUsage: 120.5, backEndStatus: 'OK', recomenderStatus: 'OK', createdAt: now, updatedAt: now }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('metrics', { id: [1] }, {});
  }
};
