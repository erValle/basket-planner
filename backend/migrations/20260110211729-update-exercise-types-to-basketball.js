'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Agregar una columna temporal VARCHAR
    await queryInterface.addColumn('exercises', 'type_temp', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // 2. Copiar y transformar los valores a la columna temporal
    await queryInterface.sequelize.query(`
    UPDATE exercises SET type_temp =
        CASE type::text
        WHEN 'cardio' THEN 'fisico'
        WHEN 'strength' THEN 'tecnico'
        WHEN 'flexibility' THEN 'fisico'
        WHEN 'balance' THEN 'tactico'
        ELSE type::text
        END
    `);

    // 3. Eliminar la columna antigua (que usa el enum)
    await queryInterface.removeColumn('exercises', 'type');

    // 4. Eliminar el enum antiguo
    await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS enum_exercises_type
    `);

    // 5. Crear el nuevo enum
    await queryInterface.sequelize.query(`
    CREATE TYPE enum_exercises_type AS ENUM ('tecnico', 'tactico', 'fisico', 'tiro', 'defensa', 'ataque')
    `);

    // 6. Agregar la columna 'type' con el nuevo enum
    await queryInterface.addColumn('exercises', 'type', {
      type: Sequelize.ENUM('tecnico', 'tactico', 'fisico', 'tiro', 'defensa', 'ataque'),
      allowNull: false,
      defaultValue: 'tactico',
    });

    // 7. Copiar valores de type_temp a type
    await queryInterface.sequelize.query(`
    UPDATE exercises SET type = type_temp::enum_exercises_type
    `);

    // 8. Eliminar la columna temporal
    await queryInterface.removeColumn('exercises', 'type_temp');
  },

  async down(queryInterface, Sequelize) {
    // 1. Agregar columna temporal
    await queryInterface.addColumn('exercises', 'type_temp', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // 2. Copiar y revertir los valores
    await queryInterface.sequelize.query(`
    UPDATE exercises SET type_temp =
        CASE type::text
        WHEN 'fisico' THEN 'cardio'
        WHEN 'tecnico' THEN 'strength'
        WHEN 'tactico' THEN 'balance'
        WHEN 'tiro' THEN 'strength'
        WHEN 'defensa' THEN 'balance'
        WHEN 'ataque' THEN 'balance'
        ELSE type::text
        END
    `);

    // 3. Eliminar columna type y el enum nuevo
    await queryInterface.removeColumn('exercises', 'type');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_exercises_type`);

    // 4. Recrear el enum antiguo
    await queryInterface.sequelize.query(`
    CREATE TYPE enum_exercises_type AS ENUM ('cardio', 'strength', 'flexibility', 'balance')
    `);

    // 5. Agregar columna type con enum antiguo
    await queryInterface.addColumn('exercises', 'type', {
      type: Sequelize.ENUM('cardio', 'strength', 'flexibility', 'balance'),
      allowNull: false,
      defaultValue: 'balance',
    });

    // 6. Copiar valores de vuelta
    await queryInterface.sequelize.query(`
    UPDATE exercises SET type = type_temp::enum_exercises_type
    `);

    // 7. Eliminar columna temporal
    await queryInterface.removeColumn('exercises', 'type_temp');
  },
};
