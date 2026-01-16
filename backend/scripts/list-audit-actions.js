#!/usr/bin/env node
/**
 * Script de utilidad para consultar las acciones de auditoría permitidas
 * Uso: node scripts/list-audit-actions.js
 */

const { ALLOWED_AUDIT_ACTIONS } = require('../src/services/auditLogService');

console.log('\n📋 ACCIONES DE AUDITORÍA PERMITIDAS\n');
console.log('═'.repeat(60));

// Agrupar por categoría
const categorized = {};

ALLOWED_AUDIT_ACTIONS.forEach(action => {
  const [category] = action.split('.');
  if (!categorized[category]) {
    categorized[category] = [];
  }
  categorized[category].push(action);
});

// Emojis por categoría
const categoryEmojis = {
  user: '👤',
  training_plan: '📋',
  training_plan_version: '📄',
  plan_assignment: '🎯',
  feedback: '💬',
  club: '🏢',
  team: '👥',
  exercise: '🏋️',
  equipment: '⚙️',
};

// Mostrar acciones agrupadas
Object.keys(categorized).sort().forEach(category => {
  const emoji = categoryEmojis[category] || '📌';
  console.log(`\n${emoji} ${category.toUpperCase().replace(/_/g, ' ')}`);
  console.log('─'.repeat(60));
  
  categorized[category].sort().forEach(action => {
    const [, actionName] = action.split('.');
    console.log(`  ✓ ${action}`);
  });
});

console.log('\n' + '═'.repeat(60));
console.log(`\nTotal de acciones permitidas: ${ALLOWED_AUDIT_ACTIONS.size}`);
console.log('\n💡 Para añadir una nueva acción, edita ALLOWED_AUDIT_ACTIONS');
console.log('   en backend/src/services/auditLogService.js\n');
