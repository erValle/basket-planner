'use strict';


module.exports = {
  async up (queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('exercises', [
      {
        id: 1,
        name: '1v1 closeout',
        description: 'Trabajo defensivo: closeout + 1v1',
        difficulty: JSON.stringify({ effortTechnical: 7, effortPhysical: 6, effortMental: 7 }),
        type: 'strength',
        duration: 20,
        tags: JSON.stringify(['defense','1v1']),
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        name: 'Shooting form',
        description: 'Mecánica de tiro',
        difficulty: JSON.stringify({ effortTechnical: 6, effortPhysical: 3, effortMental: 5 }),
        type: 'flexibility',
        duration: 15,
        tags: JSON.stringify(['shooting']),
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('exercises', { id: [1,2] }, {});
  }
};
