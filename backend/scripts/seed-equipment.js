#!/usr/bin/env node
/**
 * Script para insertar equipamiento de baloncesto en la base de datos
 *
 * Uso:
 *   node scripts/seed-equipment.js [--club-id=1]
 *
 * Opciones:
 *   --club-id    ID del club al que asignar el equipamiento (por defecto: primer club disponible)
 *   --help       Muestra esta ayuda
 */

require('dotenv').config();
const { Equipment, Club } = require('../models');

const equipmentData = [
  {
    name: 'Balón de baloncesto',
    quantity: 30,
    status: 'available',
    characteristics: {
      tipo: 'balon',
      aliases: ['balon', '2_balones'],
      descripcion: 'Balones de baloncesto oficiales',
    },
  },
  {
    name: 'Conos de entrenamiento',
    quantity: 50,
    status: 'available',
    characteristics: {
      tipo: 'conos',
      aliases: ['conos'],
      descripcion: 'Conos de diferentes colores para marcaje',
    },
  },
  {
    name: 'Canasta de baloncesto',
    quantity: 6,
    status: 'available',
    characteristics: {
      tipo: 'canasta',
      aliases: ['canasta'],
      descripcion: 'Canastas reglamentarias',
    },
  },
  {
    name: 'Petos de entrenamiento',
    quantity: 20,
    status: 'available',
    characteristics: {
      tipo: 'petos',
      aliases: ['petos'],
      descripcion: 'Petos de diferentes colores para diferenciar equipos',
    },
  },
  {
    name: 'Foam pad / Almohadilla',
    quantity: 10,
    status: 'available',
    characteristics: {
      tipo: 'foam_pad',
      aliases: ['foam_pad'],
      descripcion: 'Almohadillas para ejercicios de contacto controlado',
    },
  },
  {
    name: 'Pizarra táctica',
    quantity: 4,
    status: 'available',
    characteristics: {
      tipo: 'pizarra_tactica',
      aliases: ['pizarra_tactica'],
      descripcion: 'Pizarras para explicar tácticas y jugadas',
    },
  },
  {
    name: 'Cronómetro / App temporizador',
    quantity: 5,
    status: 'available',
    characteristics: {
      tipo: 'cronometro_o_app',
      aliases: ['cronometro_o_app'],
      descripcion: 'Dispositivos para control de tiempo',
    },
  },
  {
    name: 'Colchonetas',
    quantity: 15,
    status: 'available',
    characteristics: {
      tipo: 'colchoneta',
      aliases: ['colchoneta'],
      descripcion: 'Colchonetas para ejercicios de suelo y movilidad',
    },
  },
  {
    name: 'Bandas elásticas',
    quantity: 20,
    status: 'available',
    characteristics: {
      tipo: 'banda_elastica',
      aliases: ['banda_elastica'],
      descripcion: 'Bandas de resistencia para fortalecimiento',
    },
  },
  {
    name: 'Foam roller',
    quantity: 10,
    status: 'available',
    characteristics: {
      tipo: 'foam_roller',
      aliases: ['foam_roller'],
      descripcion: 'Rodillos de espuma para liberación miofascial',
    },
  },
  {
    name: 'Cajón pliométrico',
    quantity: 8,
    status: 'available',
    characteristics: {
      tipo: 'cajon_pliometria',
      aliases: ['cajon_pliometria'],
      descripcion: 'Cajones para ejercicios de salto y pliometría',
    },
  },
  {
    name: 'Tarjetas de colores',
    quantity: 10,
    status: 'available',
    characteristics: {
      tipo: 'tarjetas_colores',
      aliases: ['tarjetas_colores'],
      descripcion: 'Tarjetas de colores para ejercicios de reacción',
    },
  },
  {
    name: 'Silbato / App señal',
    quantity: 5,
    status: 'available',
    characteristics: {
      tipo: 'silbato_o_app_senal',
      aliases: ['silbato_o_app_senal'],
      descripcion: 'Dispositivos para señales sonoras',
    },
  },
];

async function seedEquipment() {
  try {
    console.log('Iniciando inserción de equipamiento de baloncesto...\n');

    // Parsear argumentos
    const args = process.argv.slice(2);
    if (args.includes('--help')) {
      console.log(`
Uso:
  node scripts/seed-equipment.js [--club-id=1]

Opciones:
  --club-id    ID del club al que asignar el equipamiento (por defecto: primer club disponible)
  --help       Muestra esta ayuda
    `);
      process.exit(0);
    }

    let clubId = null;
    const clubIdArg = args.find((arg) => arg.startsWith('--club-id='));
    if (clubIdArg) {
      clubId = parseInt(clubIdArg.split('=')[1], 10);
    }

    // Si no se especificó club, obtener el primero disponible
    if (!clubId) {
      const firstClub = await Club.findOne({ order: [['id', 'ASC']] });
      if (!firstClub) {
        console.error('Error: No hay clubs en la base de datos.');
        console.error('   Por favor, cree un club primero o especifique un --club-id');
        process.exit(1);
      }
      clubId = firstClub.id;
    } else {
      // Verificar que el club existe
      const club = await Club.findByPk(clubId);
      if (!club) {
        console.error(`Error: No existe un club con ID ${clubId}`);
        process.exit(1);
      }
    }

    console.log(`Asignando equipamiento al club ID: ${clubId}\n`);

    // Insertar equipamiento
    let inserted = 0;
    let skipped = 0;

    for (const item of equipmentData) {
      // Verificar si ya existe
      const existing = await Equipment.findOne({
        where: { clubId, name: item.name },
      });

      if (existing) {
        console.log(`⏭️  Saltando "${item.name}" (ya existe)`);
        skipped++;
        continue;
      }

      await Equipment.create({
        clubId,
        name: item.name,
        quantity: item.quantity,
        status: item.status,
        characteristics: item.characteristics,
      });

      console.log(`Insertado: ${item.name} (${item.quantity} unidades)`);
      inserted++;
    }

    console.log(`\nResumen:`);
    console.log(`   Insertados: ${inserted}`);
    console.log(`   ⏭️  Saltados: ${skipped}`);
    console.log(`   Total: ${equipmentData.length}`);
    console.log('\nProceso completado!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error al insertar equipamiento:', error);
    process.exit(1);
  }
}

// Ejecutar
seedEquipment();
