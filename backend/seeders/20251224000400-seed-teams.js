'use strict';


module.exports = {
  async up (queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('teams', [
      { id: 1, clubId: 1, name: 'Equipo Senior A', category: 'Senior', coachId: 2, active: true, createdAt: now, updatedAt: now }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('teams', { id: [1] }, {});
  }
};
