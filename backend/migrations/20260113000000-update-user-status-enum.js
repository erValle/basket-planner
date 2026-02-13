'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Agregar 'inactive' al enum existente temporalmente
    await queryInterface.sequelize.query(
      "ALTER TYPE enum_users_status ADD VALUE IF NOT EXISTS 'inactive';"
    );

    // 2. Actualizar todos los usuarios con status 'blocked' a 'inactive'
    await queryInterface.sequelize.query(
      "UPDATE users SET status = 'inactive' WHERE status = 'blocked';"
    );

    // 3. Actualizar todos los usuarios con status 'pending' a 'active'
    await queryInterface.sequelize.query(
      "UPDATE users SET status = 'active' WHERE status = 'pending';"
    );

    // 4. Cambiar el default value a 'active'
    await queryInterface.sequelize.query(
      "ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';"
    );

    // Nota: No podemos eliminar valores de un enum en PostgreSQL de forma segura sin recrear el tipo
    // Los valores 'pending' y 'blocked' permanecerán en el enum pero no se usarán
  },

  async down(queryInterface, Sequelize) {
    // 1. Actualizar usuarios 'inactive' a 'blocked'
    await queryInterface.sequelize.query(
      "UPDATE users SET status = 'blocked' WHERE status = 'inactive';"
    );

    // 2. Restaurar el default value a 'pending'
    await queryInterface.sequelize.query(
      "ALTER TABLE users ALTER COLUMN status SET DEFAULT 'pending';"
    );
  },
};
