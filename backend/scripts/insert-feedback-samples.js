const db = require('../models');

(async () => {
  try {
    // Buscar jugadores
    const player1 = await db.User.findOne({ where: { email: 'player1@demo.com' } });
    const player2 = await db.User.findOne({ where: { email: 'player2@demo.com' } });

    if (!player1 || !player2) {
      console.log('No se encontraron los jugadores de prueba');
      await db.sequelize.close();
      return;
    }

    console.log('Jugadores encontrados:');
    console.log('  - Player 1:', player1.email, '(ID:', player1.id + ')');
    console.log('  - Player 2:', player2.email, '(ID:', player2.id + ')');

    // Buscar las planificaciones del Tech Director con sus versiones
    const td = await db.User.findOne({ where: { role: 'technical_director' } });
    const plans = await db.TrainingPlan.findAll({
      where: { createdById: td.id },
      include: [{ model: db.TrainingPlanVersion, as: 'versions' }],
    });

    console.log('\nPlanificaciones del Tech Director:', plans.length);

    const feedbacksToCreate = [];
    const now = new Date();

    for (const plan of plans) {
      if (plan.versions && plan.versions.length > 0) {
        const version = plan.versions[0];

        // Feedback de Player 1
        feedbacksToCreate.push({
          trainingPlanVersionId: version.id,
          userId: player1.id,
          targetType: 'version',
          rating: {
            overall: 4,
            difficulty: 3,
            effectiveness: 5,
            enjoyment: 4,
          },
          comments: `Muy buen entrenamiento de "${plan.name}". Me ha ayudado a mejorar mis habilidades. La intensidad fue adecuada y los ejercicios muy útiles.`,
          createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          updatedAt: now,
        });

        // Feedback de Player 2 (no todos los planes)
        if (Math.random() > 0.3) {
          feedbacksToCreate.push({
            trainingPlanVersionId: version.id,
            userId: player2.id,
            targetType: 'version',
            rating: {
              overall: Math.floor(Math.random() * 2) + 4, // 4 o 5
              difficulty: Math.floor(Math.random() * 3) + 2, // 2-4
              effectiveness: Math.floor(Math.random() * 2) + 4, // 4-5
              enjoyment: Math.floor(Math.random() * 2) + 3, // 3-4
            },
            comments: getRandomComment(plan.name),
            createdAt: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Últimos 5 días
            updatedAt: now,
          });
        }
      }
    }

    console.log('\nCreando', feedbacksToCreate.length, 'feedbacks de prueba...');

    for (const fb of feedbacksToCreate) {
      // Verificar si ya existe
      const existing = await db.Feedback.findOne({
        where: {
          trainingPlanVersionId: fb.trainingPlanVersionId,
          userId: fb.userId,
          targetType: 'version',
        },
      });

      if (!existing) {
        await db.Feedback.create(fb);
        console.log(
          'Feedback creado para versión',
          fb.trainingPlanVersionId,
          'por usuario',
          fb.userId
        );
      } else {
        console.log(
          'ℹ️ Ya existe feedback para versión',
          fb.trainingPlanVersionId,
          'por usuario',
          fb.userId
        );
      }
    }

    await db.sequelize.close();
    console.log('\nProceso completado');
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    await db.sequelize.close();
  }
})();

function getRandomComment(planName) {
  const comments = [
    `Excelente sesión de "${planName}". Noté mejora inmediata en mi rendimiento.`,
    `Buen entrenamiento. Los ejercicios son variados y desafiantes.`,
    `Me gustó mucho la estructura del plan. Clara y progresiva.`,
    `Sentí que trabajé duro pero sin excederme. Buena planificación.`,
    `Los ejercicios de "${planName}" me parecieron muy útiles para el partido.`,
    `Gran sesión. Me siento más preparado después de completarla.`,
    `Muy completo el entrenamiento. Buenos ejercicios técnicos y tácticos.`,
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}
