'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = await bcrypt.hash('123456', 10); // contraseña genérica

    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: password,
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'coach@example.com',
        name: 'Coach User',
        passwordHash: password,
        role: 'coach',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'player@example.com',
        name: 'Player User',
        passwordHash: password,
        role: 'player',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
