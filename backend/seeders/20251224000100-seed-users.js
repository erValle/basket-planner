'use strict';


const bcrypt = require('bcrypt');

module.exports = {
  async up (queryInterface) {
    const now = new Date();
    const passwordAdmin = await bcrypt.hash('Admin123!', 10);
    const passwordCoach = await bcrypt.hash('Coach123!', 10);
    const passwordPlayer = await bcrypt.hash('Player123!', 10);

    const usersToSeed = [
      { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@demo.com', passwordHash: passwordAdmin, role: 'admin', status: 'active', createdAt: now, updatedAt: now },
      { id: 2, firstName: 'Coach', lastName: 'One', email: 'coach@demo.com', passwordHash: passwordCoach, role: 'coach', status: 'active', createdAt: now, updatedAt: now },
      { id: 3, firstName: 'Player', lastName: 'One', email: 'player1@demo.com', passwordHash: passwordPlayer, role: 'player', status: 'active', createdAt: now, updatedAt: now, position: 'guard', height: 1.85 },
      { id: 4, firstName: 'Player', lastName: 'Two', email: 'player2@demo.com', passwordHash: passwordPlayer, role: 'player', status: 'active', createdAt: now, updatedAt: now, position: 'forward', height: 1.92 },
      { id: 5, firstName: 'Tech', lastName: 'Director', email: 'td@demo.com', passwordHash: passwordCoach, role: 'technical_director', status: 'active', createdAt: now, updatedAt: now }
    ];

    await queryInterface.bulkInsert('users', usersToSeed, {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('users', { email: ['admin@demo.com','coach@demo.com','player1@demo.com','player2@demo.com','td@demo.com'] }, {});
  }
};
