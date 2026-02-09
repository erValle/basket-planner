'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    // Estructura correcta: sessions[].exercises[] (no sessions[].items[])
    const sessions = [
      {
        sessionId: 'session-1',
        day: 'mon',
        name: 'Sesión 1 - Técnica y físico',
        goals: ['Mejorar tiro', 'Acondicionamiento'],
        exercises: [
          {
            exerciseId: 2,
            name: 'Tiros libres',
            type: 'shooting',
            phase: 'main',
            difficulty: { tactica: 2, tecnica: 4, fisica: 2, mental: 3 },
            durationMinutes: 15,
            description: 'Serie de tiros libres con enfoque en técnica',
          },
          {
            exerciseId: 1,
            name: 'Sprints en media cancha',
            type: 'conditioning',
            phase: 'main',
            difficulty: { tactica: 1, tecnica: 2, fisica: 5, mental: 3 },
            durationMinutes: 20,
            description: 'Sprints de acondicionamiento físico',
          },
        ],
        metadata: {
          warmup: 'Calentamiento general 10 min',
          cooldown: 'Estiramientos 5 min',
        },
        metrics: {
          durationMinutes: 35,
          estimatedLoad: 'medium',
        },
      },
      {
        sessionId: 'session-2',
        day: 'wed',
        name: 'Sesión 2 - Trabajo técnico',
        goals: ['Mejorar manejo del balón'],
        exercises: [
          {
            exerciseId: 1,
            name: 'Ejercicio técnico',
            type: 'ballhandling',
            phase: 'main',
            difficulty: { tactica: 3, tecnica: 4, fisica: 2, mental: 2 },
            durationMinutes: 25,
            description: 'Trabajo de manejo de balón',
          },
        ],
        metadata: {
          warmup: 'Calentamiento 10 min',
          cooldown: 'Estiramientos 5 min',
        },
        metrics: {
          durationMinutes: 25,
          estimatedLoad: 'low',
        },
      },
    ];

    await queryInterface.bulkInsert(
      'training_plan_versions',
      [
        {
          id: 1,
          trainingPlanId: 1,
          versionNumber: 1,
          source: 'manual',
          date: now,
          comments: 'Version inicial',
          sessions: JSON.stringify(sessions),
          createdFrom: JSON.stringify({
            source: 'seed',
            goals: ['demo'],
            constraints: { days: ['mon', 'wed'] },
            model: { name: 'baseline', version: '0.0.0' },
          }),
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );

    // Actualizar training_plans para establecer activeVersionId
    await queryInterface.sequelize.query(`
    UPDATE training_plans
    SET "activeVersionId" = 1
    WHERE id = 1
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('training_plan_versions', { id: [1] }, {});
    await queryInterface.sequelize.query(`
    UPDATE training_plans
    SET "activeVersionId" = NULL
    WHERE id = 1
    `);
  },
};
