'use strict';


module.exports = {
  async up (queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('clubs', [
      { id: 1, name: 'Club Demo', address: 'Calle Ejemplo 1', active: true, createdAt: now, updatedAt: now }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('clubs', { name: ['Club Demo'] }, {});
  }
};
