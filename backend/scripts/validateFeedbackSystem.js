#!/usr/bin/env node

/**
 * Script de validación del sistema de feedback
 * Ejecuta pruebas básicas para verificar que la implementación funciona
 * 
 * Uso: node backend/scripts/validateFeedbackSystem.js
 */

const { Sequelize } = require('sequelize');
const config = require('../config/config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  ...dbConfig,
  logging: false,
});

async function validateFeedbackSystem() {
  console.log('🔍 Validando Sistema de Feedback...\n');

  try {
    // 1. Verificar conexión a BD
    console.log('1️⃣  Verificando conexión a base de datos...');
    await sequelize.authenticate();
    console.log('   ✅ Conexión exitosa\n');

    // 2. Verificar que existen las tablas necesarias
    console.log('2️⃣  Verificando tablas necesarias...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    const requiredTables = ['feedbacks', 'plan_assignments', 'training_plan_versions', 'training_plans', 'users'];
    const missingTables = requiredTables.filter(t => !tables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`   ❌ Faltan tablas: ${missingTables.join(', ')}`);
      console.log('   💡 Ejecuta: npx sequelize-cli db:migrate');
      process.exit(1);
    }
    console.log('   ✅ Todas las tablas existen\n');

    // 3. Verificar columnas nuevas en plan_assignments
    console.log('3️⃣  Verificando columna trainingPlanVersionId en plan_assignments...');
    const [assignmentColumns] = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'plan_assignments' AND column_name = 'trainingPlanVersionId'`
    );
    
    if (assignmentColumns.length === 0) {
      console.log('   ❌ Columna trainingPlanVersionId no existe');
      console.log('   💡 Ejecuta migración: 20260106010000-add-version-id-to-plan-assignments.js');
      process.exit(1);
    }
    console.log('   ✅ Columna trainingPlanVersionId existe\n');

    // 4. Verificar columnas nuevas en feedbacks
    console.log('4️⃣  Verificando columnas sessionId y targetType en feedbacks...');
    const [feedbackColumns] = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'feedbacks' AND column_name IN ('sessionId', 'targetType')`
    );
    
    if (feedbackColumns.length < 2) {
      console.log('   ❌ Faltan columnas sessionId o targetType');
      console.log('   💡 Ejecuta migración: 20260106020000-add-session-metadata-to-feedbacks.js');
      process.exit(1);
    }
    console.log('   ✅ Columnas sessionId y targetType existen\n');

    // 5. Verificar índices
    console.log('5️⃣  Verificando índices...');
    const [indexes] = await sequelize.query(
      `SELECT indexname FROM pg_indexes 
       WHERE tablename = 'feedbacks' AND indexname LIKE '%session%'`
    );
    
    if (indexes.length === 0) {
      console.log('   ⚠️  Índice feedbacks_version_session_idx no encontrado (no crítico)');
    } else {
      console.log('   ✅ Índices de feedback configurados\n');
    }

    // 6. Verificar datos de ejemplo
    console.log('6️⃣  Verificando datos de ejemplo...');
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE role = \'player\'');
    const [plans] = await sequelize.query('SELECT COUNT(*) as count FROM training_plans');
    const [versions] = await sequelize.query('SELECT COUNT(*) as count FROM training_plan_versions');
    
    console.log(`   📊 Jugadores: ${users[0].count}`);
    console.log(`   📊 Planes: ${plans[0].count}`);
    console.log(`   📊 Versiones: ${versions[0].count}`);
    
    if (users[0].count === 0 || plans[0].count === 0 || versions[0].count === 0) {
      console.log('   ⚠️  Faltan datos de ejemplo');
      console.log('   💡 Ejecuta seeders para crear datos de prueba');
    } else {
      console.log('   ✅ Datos de ejemplo presentes\n');
    }

    // 7. Verificar estructura de rating en feedbacks existentes
    console.log('7️⃣  Verificando estructura de feedbacks...');
    const [existingFeedbacks] = await sequelize.query(
      'SELECT id, rating, "targetType", "sessionId" FROM feedbacks LIMIT 5'
    );
    
    if (existingFeedbacks.length > 0) {
      console.log(`   📊 Feedbacks existentes: ${existingFeedbacks.length}`);
      console.log('   Ejemplo:');
      console.log(JSON.stringify(existingFeedbacks[0], null, 2));
    } else {
      console.log('   ℹ️  No hay feedbacks todavía (esperado en sistema nuevo)\n');
    }

    // 8. Verificar que los servicios están cargados
    console.log('8️⃣  Verificando servicios de backend...');
    try {
      const feedbackService = require('../src/services/feedbackService');
      const methods = Object.keys(feedbackService);
      
      const requiredMethods = [
        'createFeedback',
        'canUserProvideFeedback',
        'getVersionStats',
        'getSessionStats'
      ];
      
      const missingMethods = requiredMethods.filter(m => !methods.includes(m));
      
      if (missingMethods.length > 0) {
        console.log(`   ❌ Faltan métodos: ${missingMethods.join(', ')}`);
        process.exit(1);
      }
      
      console.log('   ✅ Todos los métodos del servicio presentes\n');
    } catch (error) {
      console.log('   ❌ Error cargando feedbackService:', error.message);
      process.exit(1);
    }

    // 9. Test de validación de schema
    console.log('9️⃣  Verificando schemas de validación...');
    try {
      const { createFeedbackSchema } = require('../src/validation/feedbackSchemas');
      
      // Test version-level
      const versionPayload = {
        trainingPlanVersionId: 1,
        targetType: 'version',
        rating: { overall: 8 }
      };
      
      const { error: versionError } = createFeedbackSchema.validate(versionPayload);
      if (versionError) {
        console.log('   ❌ Schema version-level inválido:', versionError.message);
        process.exit(1);
      }
      
      // Test session-level
      const sessionPayload = {
        trainingPlanVersionId: 1,
        targetType: 'session',
        sessionId: 'MON-2026-01-06',
        rating: { rpe: 7, fatigue: 6 }
      };
      
      const { error: sessionError } = createFeedbackSchema.validate(sessionPayload);
      if (sessionError) {
        console.log('   ❌ Schema session-level inválido:', sessionError.message);
        process.exit(1);
      }
      
      console.log('   ✅ Schemas de validación correctos\n');
    } catch (error) {
      console.log('   ❌ Error validando schemas:', error.message);
      process.exit(1);
    }

    // 10. Resumen final
    console.log('═'.repeat(60));
    console.log('✅ VALIDACIÓN COMPLETADA CON ÉXITO');
    console.log('═'.repeat(60));
    console.log('\n📋 Sistema de Feedback Operativo:');
    console.log('   ✅ Base de datos migrada');
    console.log('   ✅ Modelos actualizados');
    console.log('   ✅ Servicios cargados');
    console.log('   ✅ Validaciones configuradas');
    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Ejecutar backend: npm start');
    console.log('   2. Probar endpoints:');
    console.log('      POST /api/feedbacks');
    console.log('      GET  /api/feedbacks/version/:id/can-provide');
    console.log('      GET  /api/feedbacks/version/:id/stats');
    console.log('   3. Ejecutar frontend y probar en SessionDetail');
    console.log('\n📖 Documentación: SISTEMA_FEEDBACK_IMPLEMENTACION.md\n');

  } catch (error) {
    console.error('\n❌ Error durante validación:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar validación
if (require.main === module) {
  validateFeedbackSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { validateFeedbackSystem };
