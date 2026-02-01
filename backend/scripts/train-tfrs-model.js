#!/usr/bin/env node

/**
 * Script de entrenamiento manual para el modelo TFRS
 * 
 * Este es el ÚNICO método para entrenar el modelo.
 * El entrenamiento NO se realiza automáticamente en tiempo de ejecución.
 * 
 * Uso:
 *   node scripts/train-tfrs-model.js [opciones]
 * 
 * Opciones:
 *   --warm-start         Entrenar con datos sintéticos generados por heurísticas
 *   --samples <n>        Número de muestras sintéticas (default: 10000)
 *   --info               Mostrar información del modelo
 */

const path = require('path');
const fs = require('fs');

// Configurar paths
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

async function main() {
  const args = process.argv.slice(2);
  
  console.log('='.repeat(60));
  console.log('TFRS Model Training Script (Manual Only)');
  console.log('='.repeat(60));
  console.log();

  // Parsear argumentos
  const options = {
    warmStart: args.includes('--warm-start'),
    info: args.includes('--info'),
    samples: 10000
  };

  // Obtener número de muestras si se especificó
  const samplesIndex = args.indexOf('--samples');
  if (samplesIndex !== -1 && args[samplesIndex + 1]) {
    options.samples = parseInt(args[samplesIndex + 1], 10);
  }

  // Cargar modelo TFRS
  console.log('Loading TFRS model module...');
  const recommender = require('../src/recommender');
  const { getModelInfo, listAvailableModels } = require('../src/recommender/modelManager');

  // Mostrar información del modelo si se solicita
  if (options.info) {
    console.log('\nModel Information:');
    console.log('-'.repeat(40));
    const info = getModelInfo();
    console.log(JSON.stringify(info, null, 2));
    console.log();
    
    console.log('Available Models:');
    console.log('-'.repeat(40));
    const models = listAvailableModels();
    models.forEach(m => {
      console.log(`  ${m.isActive ? '>' : ' '} ${m.key}: ${m.description} (${m.type})`);
    });
    console.log();
    
    if (!options.warmStart && !options.useFeedback) {
      return;
    }
  }

  // Cargar ejercicios
  console.log('Loading exercises from database...');
  let exercises = [];
  
  try {
    // Intentar cargar desde JSON de ejercicios
    const exercisesPath = path.join(rootDir, '..', 'db_ejercicios.json');
    if (fs.existsSync(exercisesPath)) {
      const data = JSON.parse(fs.readFileSync(exercisesPath, 'utf-8'));
      exercises = data.ejercicios || data;
      console.log(`  Loaded ${exercises.length} exercises from JSON file`);
    } else {
      // Intentar cargar desde base de datos
      const db = require('../models');
      const dbExercises = await db.Exercise.findAll({
        where: { active: true },
        raw: true
      });
      exercises = dbExercises;
      console.log(`  Loaded ${exercises.length} exercises from database`);
    }
  } catch (error) {
    console.error('Error loading exercises:', error.message);
    console.log('Attempting to load reduced exercise file...');
    
    const reducedPath = path.join(rootDir, '..', 'db_ejercicios_reducido.json');
    if (fs.existsSync(reducedPath)) {
      const data = JSON.parse(fs.readFileSync(reducedPath, 'utf-8'));
      exercises = data.ejercicios || data;
      console.log(`  Loaded ${exercises.length} exercises from reduced JSON file`);
    }
  }

  if (exercises.length === 0) {
    console.error('No exercises available for training. Please check your data sources.');
    process.exit(1);
  }

  // Inicializar modelo (intenta cargar pre-entrenado por defecto)
  console.log('\nInitializing TFRS model...');
  try {
    await recommender.initializeModel(exercises);
    console.log('  Model initialized successfully');
  } catch (error) {
    console.error('Error initializing model:', error.message);
    process.exit(1);
  }

  // Warm-start training
  if (options.warmStart) {
    console.log('\n' + '='.repeat(60));
    console.log('WARM-START TRAINING');
    console.log('='.repeat(60));
    console.log(`  Samples: ${options.samples}`);
    console.log();

    try {
      // Importar trainer directamente
      const TFRSRankingModel = require('../src/recommender/tfrsModel');
      const { TFRSTrainer } = require('../src/recommender/trainer');
      
      // Crear modelo e inicializarlo
      const model = new TFRSRankingModel();
      model.buildModel(exercises);
      
      // Crear trainer y generar datos
      const trainer = new TFRSTrainer(model);
      
      console.log('Generating synthetic training data...');
      const trainingData = trainer.generateSyntheticTrainingData(exercises, options.samples);
      
      console.log('Starting training...');
      const startTime = Date.now();
      const result = await trainer.train(trainingData);
      const duration = (Date.now() - startTime) / 1000;

      console.log('\nTraining completed:');
      console.log(`  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`  Final Loss: ${result.finalLoss.toFixed(6)}`);
      console.log(`  Final Val Loss: ${result.finalValLoss.toFixed(6)}`);
      
      // Guardar modelo
      await model.saveModel();
      console.log('  Model saved successfully');
      
      // Guardar metadata del entrenamiento
      const trainingMetadata = {
        trainedAt: new Date().toISOString(),
        trainingType: 'warm-start',
        samples: options.samples,
        epochs: result.history.loss.length,
        durationSeconds: duration,
        finalLoss: result.finalLoss,
        finalValLoss: result.finalValLoss,
        history: result.history,
        exerciseCount: exercises.length,
        modelVersion: require('../src/recommender/config').modelVersion
      };
      
      const metadataPath = path.join(rootDir, 'src', 'recommender', 'saved_model', 'training_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(trainingMetadata, null, 2));
      console.log('  Training metadata saved');
      
    } catch (error) {
      console.error('Error during warm-start training:', error.message);
      console.error(error.stack);
    }
  }

  // Mostrar resumen final
  console.log('\n' + '='.repeat(60));
  console.log('TRAINING COMPLETE');
  console.log('='.repeat(60));
  
  const finalInfo = getModelInfo();
  console.log(`  Model Version: ${finalInfo.version}`);
  console.log(`  Is Trained: ${finalInfo.isTrained}`);
  console.log(`  Is Initialized: ${finalInfo.isInitialized}`);
  
  console.log('\nThe model is ready to use.');
  console.log();
}

// Ejecutar
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
