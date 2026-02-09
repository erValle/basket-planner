#!/usr/bin/env node
/**
 * Script para limpiar logs de auditoría de HTTP requests
 * Elimina todos los registros con action 'http_request.success' o 'http_request.error'
 *
 * Uso: node scripts/clean-http-audit-logs.js
 */

require('dotenv').config();
const { AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');

async function cleanHttpAuditLogs() {
  try {
    console.log('\nVerificando logs de auditoría...\n');

    // Contar registros HTTP
    const httpLogsCount = await AuditLog.count({
      where: {
        action: {
          [Op.in]: ['http_request.success', 'http_request.error'],
        },
      },
    });

    const totalCount = await AuditLog.count();
    const businessLogsCount = totalCount - httpLogsCount;

    console.log('Estadísticas actuales:');
    console.log(`   Total de logs: ${totalCount}`);
    console.log(`   Logs de HTTP requests: ${httpLogsCount}`);
    console.log(`   Logs de negocio: ${businessLogsCount}`);
    console.log('');

    if (httpLogsCount === 0) {
      console.log('No hay logs de HTTP requests para limpiar.');
      process.exit(0);
    }

    // Confirmar con el usuario (simulado para script)
    console.log(` Se van a eliminar ${httpLogsCount} registros de HTTP requests`);
    console.log('   Esto NO afectará los logs de acciones de negocio.\n');

    // Eliminar logs de HTTP
    console.log('🗑️  Eliminando logs de HTTP requests...');
    const deletedCount = await AuditLog.destroy({
      where: {
        action: {
          [Op.in]: ['http_request.success', 'http_request.error'],
        },
      },
    });

    console.log(`\nLimpieza completada!`);
    console.log(`   Registros eliminados: ${deletedCount}`);

    // Verificar resultado final
    const finalCount = await AuditLog.count();
    console.log(`   Registros restantes: ${finalCount}`);

    // Mostrar estadísticas finales
    console.log('\nAcciones de negocio conservadas:');
    const stats = await AuditLog.findAll({
      attributes: ['action', [sequelize.fn('COUNT', '*'), 'count']],
      group: ['action'],
      order: [[sequelize.fn('COUNT', '*'), 'DESC']],
      raw: true,
    });

    stats.forEach((stat) => {
      console.log(`   ${stat.action}: ${stat.count}`);
    });

    console.log('\nBase de datos de auditoría limpia y optimizada!\n');

    process.exit(0);
  } catch (error) {
    console.error('\nError limpiando logs:', error);
    process.exit(1);
  }
}

// Ejecutar
cleanHttpAuditLogs();
