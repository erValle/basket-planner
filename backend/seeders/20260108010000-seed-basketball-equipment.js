'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener el primer club disponible
    const [clubs] = await queryInterface.sequelize.query(
      'SELECT id FROM clubs ORDER BY id LIMIT 1;'
    );
    
    if (clubs.length === 0) {
      console.log('⚠️  No hay clubs en la base de datos. Cree un club primero.');
      return;
    }
    
    const clubId = clubs[0].id;
    console.log(`ℹ️  Asignando equipamiento al club ID: ${clubId}`);
    
    const equipment = [
      {
        clubId: clubId,
        name: 'Balón de baloncesto',
        quantity: 30,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'balon',
          aliases: ['balon', '2_balones'],
          descripcion: 'Balones de baloncesto oficiales'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Conos de entrenamiento',
        quantity: 50,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'conos',
          aliases: ['conos'],
          descripcion: 'Conos de diferentes colores para marcaje'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Canasta de baloncesto',
        quantity: 6,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'canasta',
          aliases: ['canasta'],
          descripcion: 'Canastas reglamentarias'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Petos de entrenamiento',
        quantity: 20,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'petos',
          aliases: ['petos'],
          descripcion: 'Petos de diferentes colores para diferenciar equipos'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Foam pad / Almohadilla',
        quantity: 10,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'foam_pad',
          aliases: ['foam_pad'],
          descripcion: 'Almohadillas para ejercicios de contacto controlado'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Pizarra táctica',
        quantity: 4,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'pizarra_tactica',
          aliases: ['pizarra_tactica'],
          descripcion: 'Pizarras para explicar tácticas y jugadas'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Cronómetro / App temporizador',
        quantity: 5,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'cronometro_o_app',
          aliases: ['cronometro_o_app'],
          descripcion: 'Dispositivos para control de tiempo'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Colchonetas',
        quantity: 15,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'colchoneta',
          aliases: ['colchoneta'],
          descripcion: 'Colchonetas para ejercicios de suelo y movilidad'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Bandas elásticas',
        quantity: 20,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'banda_elastica',
          aliases: ['banda_elastica'],
          descripcion: 'Bandas de resistencia para fortalecimiento'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Foam roller',
        quantity: 10,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'foam_roller',
          aliases: ['foam_roller'],
          descripcion: 'Rodillos de espuma para liberación miofascial'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Cajón pliométrico',
        quantity: 8,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'cajon_pliometria',
          aliases: ['cajon_pliometria'],
          descripcion: 'Cajones para ejercicios de salto y pliometría'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Tarjetas de colores',
        quantity: 10,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'tarjetas_colores',
          aliases: ['tarjetas_colores'],
          descripcion: 'Tarjetas de colores para ejercicios de reacción'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: clubId,
        name: 'Silbato / App señal',
        quantity: 5,
        status: 'available',
        characteristics: JSON.stringify({
          tipo: 'silbato_o_app_senal',
          aliases: ['silbato_o_app_senal'],
          descripcion: 'Dispositivos para señales sonoras'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('equipment', equipment, {});
    console.log(`✅ Insertados ${equipment.length} items de equipamiento`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('equipment', null, {});
  }
};
