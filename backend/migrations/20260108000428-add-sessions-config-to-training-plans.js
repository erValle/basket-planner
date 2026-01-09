'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Añadir número de sesiones deseadas
    await queryInterface.addColumn('training_plans', 'sessionsCount', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Número de sesiones en la planificación'
    });

    // Renombrar el concepto: duration ahora será sessionDurationMinutes
    // para ser más explícito que se refiere a duración por sesión
    await queryInterface.addColumn('training_plans', 'sessionDurationMinutes', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Duración máxima por sesión en minutos'
    });

    // Migrar datos existentes: duration -> sessionDurationMinutes
    await queryInterface.sequelize.query(`
      UPDATE training_plans 
      SET "sessionDurationMinutes" = duration 
      WHERE duration IS NOT NULL
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('training_plans', 'sessionsCount');
    await queryInterface.removeColumn('training_plans', 'sessionDurationMinutes');
  }
};
