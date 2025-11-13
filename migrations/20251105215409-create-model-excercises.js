'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_exercises_category AS ENUM ('shooting', 'dribbling', 'passing', 'defense', 'strength', 'agility', 'tactics', 'endurance');"
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_exercises_difficulty AS ENUM ('easy', 'medium', 'hard');"
    );

    await queryInterface.createTable('exercises', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: 'enum_exercises_category',
        allowNull: false
      },
      difficulty: {
        type: 'enum_exercises_difficulty',
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 300 // duration in seconds
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      tags: { // Includes keywords related to the exercise
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: null
      },
      mediaUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // Ponderations {physical, tactical, technical}
      weights: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('exercises', ['category'], {name: 'exercises_category_index'});
    await queryInterface.addIndex('exercises', ['difficulty'], {name: 'exercises_difficulty_index'});
    await queryInterface.addIndex('exercises', ['isActive'], {name: 'exercises_isActive_index'});
    await queryInterface.addIndex('exercises', ['createdAt'], {name: 'exercises_createdAt_index'});

  },

  async down (queryInterface, Sequelize) {
    
    await queryInterface.removeIndex('exercises', 'exercises_category_index');
    await queryInterface.removeIndex('exercises', 'exercises_difficulty_index');
    await queryInterface.removeIndex('exercises', 'exercises_isActive_index');
    await queryInterface.removeIndex('exercises', 'exercises_createdAt_index');

    await queryInterface.dropTable('exercises');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_exercises_category;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_exercises_difficulty;');
  }
};
