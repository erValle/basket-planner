/**
 * TensorFlow Ranking Model
 *
 * Implementación de un modelo de ranking usando TensorFlow.js
 * basado en la arquitectura de Two-Tower para recomendaciones.
 */

const tf = require('@tensorflow/tfjs');
const config = require('./config');

class TFRSRankingModel {
  constructor() {
    this.userTower = null;
    this.exerciseTower = null;
    this.rankingModel = null;
    this.vocabularyEncoders = {};
    this.isInitialized = false;
    this.isTrained = false;
  }

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  initializeVocabularies(exerciseData = []) {
    const { vocabularies } = config;

    this.vocabularyEncoders = {
      intensity: this._createOneHotEncoder(vocabularies.intensities),
      sessionPhase: this._createOneHotEncoder(vocabularies.sessionPhases),
      position: this._createOneHotEncoder(vocabularies.positions),
      exerciseType: this._createOneHotEncoder(vocabularies.exerciseTypes),
      goals: this._createMultiHotEncoder(vocabularies.goals),
    };

    if (exerciseData.length > 0) {
      // Generar IDs si no existen (para ejercicios cargados desde JSON sin ID)
      const exerciseIds = exerciseData.map((e, index) => {
        const id = e.id !== undefined ? e.id : index + 1;
        // Asignar ID al ejercicio si no lo tiene
        if (e.id === undefined) {
          e.id = id;
        }
        return id.toString();
      });
      this.vocabularyEncoders.exerciseId = this._createEmbeddingLookup(exerciseIds);
    }

    if (exerciseData.length > 0) {
      const allTags = new Set();
      exerciseData.forEach((e) => {
        if (e.etiquetas && Array.isArray(e.etiquetas)) {
          e.etiquetas.forEach((tag) => allTags.add(tag.toLowerCase()));
        }
      });
      this.vocabularyEncoders.tags = this._createMultiHotEncoder(Array.from(allTags));
    }
  }

  _createOneHotEncoder(categories) {
    const categoryToIndex = {};
    categories.forEach((cat, idx) => {
      categoryToIndex[cat.toLowerCase()] = idx;
    });

    return {
      encode: (value) => {
        const encoded = new Array(categories.length).fill(0);
        const normalizedValue = (value || '').toString().toLowerCase();
        const index = categoryToIndex[normalizedValue];
        if (index !== undefined) {
          encoded[index] = 1;
        }
        return encoded;
      },
      size: categories.length,
    };
  }

  _createMultiHotEncoder(categories) {
    const categoryToIndex = {};
    categories.forEach((cat, idx) => {
      categoryToIndex[cat.toLowerCase()] = idx;
    });

    return {
      encode: (values) => {
        const encoded = new Array(categories.length).fill(0);
        if (Array.isArray(values)) {
          values.forEach((val) => {
            const normalizedVal = (val || '').toString().toLowerCase();
            const index = categoryToIndex[normalizedVal];
            if (index !== undefined) {
              encoded[index] = 1;
            }
          });
        }
        return encoded;
      },
      size: categories.length,
    };
  }

  _createEmbeddingLookup(ids) {
    const idToIndex = {};
    ids.forEach((id, idx) => {
      idToIndex[id.toString()] = idx;
    });

    return {
      getIndex: (id) => {
        const index = idToIndex[id.toString()];
        return index !== undefined ? index : ids.length;
      },
      size: ids.length + 1,
    };
  }

  // ============================================================================
  // CONSTRUCCIÓN DEL MODELO
  // ============================================================================

  _calculateInputDimensions() {
    const contextCategoricalSize =
      (this.vocabularyEncoders.intensity?.size || 3) +
      (this.vocabularyEncoders.sessionPhase?.size || 5) +
      (this.vocabularyEncoders.position?.size || 6);

    const contextNumericalSize = 6;
    const goalsSize = this.vocabularyEncoders.goals?.size || config.vocabularies.goals.length;

    const exerciseCategoricalSize =
      this.vocabularyEncoders.exerciseType?.size || config.vocabularies.exerciseTypes.length;

    const exerciseNumericalSize = 5;
    const tagsSize = this.vocabularyEncoders.tags?.size || 50;

    return {
      contextInputDim: contextCategoricalSize + contextNumericalSize + goalsSize,
      exerciseInputDim: exerciseCategoricalSize + exerciseNumericalSize + tagsSize,
      exerciseIdVocabSize: this.vocabularyEncoders.exerciseId?.size || 1000,
    };
  }

  _buildUserTower(inputDim) {
    const { architecture } = config;

    const input = tf.input({ shape: [inputDim], name: 'context_input' });

    let x = input;
    for (let i = 0; i < architecture.userTowerLayers.length; i++) {
      x = tf.layers
        .dense({
          units: architecture.userTowerLayers[i],
          activation: architecture.activation,
          kernelRegularizer: tf.regularizers.l2({ l2: architecture.l2Regularization }),
          name: `user_tower_dense_${i}`,
        })
        .apply(x);

      x = tf.layers
        .dropout({
          rate: architecture.dropoutRate,
          name: `user_tower_dropout_${i}`,
        })
        .apply(x);
    }

    const output = tf.layers
      .dense({
        units: architecture.embeddingDim,
        activation: null,
        name: 'user_embedding',
      })
      .apply(x);

    return tf.model({ inputs: input, outputs: output, name: 'user_tower' });
  }

  _buildExerciseTower(inputDim, exerciseVocabSize) {
    const { architecture } = config;

    const featuresInput = tf.input({ shape: [inputDim], name: 'exercise_features_input' });
    const idInput = tf.input({ shape: [1], dtype: 'int32', name: 'exercise_id_input' });

    const idEmbedding = tf.layers
      .embedding({
        inputDim: exerciseVocabSize,
        outputDim: architecture.embeddingDim,
        name: 'exercise_id_embedding',
      })
      .apply(idInput);

    const flatIdEmbedding = tf.layers.flatten({ name: 'flatten_id_embedding' }).apply(idEmbedding);

    let x = featuresInput;
    for (let i = 0; i < architecture.exerciseTowerLayers.length; i++) {
      x = tf.layers
        .dense({
          units: architecture.exerciseTowerLayers[i],
          activation: architecture.activation,
          kernelRegularizer: tf.regularizers.l2({ l2: architecture.l2Regularization }),
          name: `exercise_tower_dense_${i}`,
        })
        .apply(x);

      x = tf.layers
        .dropout({
          rate: architecture.dropoutRate,
          name: `exercise_tower_dropout_${i}`,
        })
        .apply(x);
    }

    const combined = tf.layers
      .concatenate({ name: 'combine_features_embedding' })
      .apply([x, flatIdEmbedding]);

    const output = tf.layers
      .dense({
        units: architecture.embeddingDim,
        activation: null,
        name: 'exercise_embedding',
      })
      .apply(combined);

    return tf.model({
      inputs: [featuresInput, idInput],
      outputs: output,
      name: 'exercise_tower',
    });
  }

  buildModel(exerciseData = []) {
    if (exerciseData.length > 0) {
      this.initializeVocabularies(exerciseData);
    }

    const dims = this._calculateInputDimensions();

    this.userTower = this._buildUserTower(dims.contextInputDim);
    this.exerciseTower = this._buildExerciseTower(dims.exerciseInputDim, dims.exerciseIdVocabSize);

    const { architecture } = config;

    const contextInput = tf.input({ shape: [dims.contextInputDim], name: 'context_input' });
    const exerciseFeaturesInput = tf.input({
      shape: [dims.exerciseInputDim],
      name: 'exercise_features',
    });
    const exerciseIdInput = tf.input({ shape: [1], dtype: 'int32', name: 'exercise_id' });

    const contextEmbedding = this.userTower.apply(contextInput);
    const exerciseEmbedding = this.exerciseTower.apply([exerciseFeaturesInput, exerciseIdInput]);

    const combined = tf.layers
      .concatenate({ name: 'combined_embeddings' })
      .apply([contextEmbedding, exerciseEmbedding]);

    let rankingLayer = combined;
    for (let i = 0; i < architecture.rankingLayers.length; i++) {
      rankingLayer = tf.layers
        .dense({
          units: architecture.rankingLayers[i],
          activation: architecture.activation,
          kernelRegularizer: tf.regularizers.l2({ l2: architecture.l2Regularization }),
          name: `ranking_dense_${i}`,
        })
        .apply(rankingLayer);

      rankingLayer = tf.layers
        .dropout({
          rate: architecture.dropoutRate,
          name: `ranking_dropout_${i}`,
        })
        .apply(rankingLayer);
    }

    const output = tf.layers
      .dense({
        units: 1,
        activation: 'sigmoid',
        name: 'ranking_output',
      })
      .apply(rankingLayer);

    this.rankingModel = tf.model({
      inputs: [contextInput, exerciseFeaturesInput, exerciseIdInput],
      outputs: output,
      name: 'tfrs_ranking_model',
    });

    this.rankingModel.compile({
      optimizer: tf.train.adam(config.training.learningRate),
      loss: config.training.loss,
      metrics: ['mse', 'mae'],
    });

    this.isInitialized = true;
    console.log('TFRS Ranking Model built successfully');

    return this.rankingModel;
  }

  // ============================================================================
  // FEATURE ENGINEERING
  // ============================================================================

  encodeContextFeatures(context) {
    const { defaults } = config;
    const features = [];

    features.push(
      ...this.vocabularyEncoders.intensity.encode(context.intensity || defaults.intensity)
    );
    features.push(
      ...this.vocabularyEncoders.sessionPhase.encode(context.sessionPhase || defaults.sessionPhase)
    );
    features.push(
      ...this.vocabularyEncoders.position.encode(context.position || defaults.position)
    );

    features.push(
      this._normalizeMinutes(
        context.sessionDurationMinutes || defaults.sessionDurationMinutes,
        0,
        180
      )
    );
    features.push(this._normalizeMinutes(context.currentSessionMinutes || 0, 0, 180));
    features.push(
      this._normalizeMinutes(context.remainingMinutes || defaults.sessionDurationMinutes, 0, 180)
    );
    features.push(this._normalizeCount(context.exercisesInSession || 0, 0, 20));
    features.push(this._normalizeCount(context.typesUsedCount || 0, 0, 10));
    features.push(
      this._normalizeCount(context.targetExerciseCount || defaults.targetExerciseCount, 1, 20)
    );

    features.push(...this.vocabularyEncoders.goals.encode(context.goals || []));

    return features;
  }

  encodeExerciseFeatures(exercise) {
    const features = [];

    features.push(...this.vocabularyEncoders.exerciseType.encode(exercise.tipo || ''));

    // Duración: acepta duracion_minutos o duracion_segundos/60
    let duracionMinutos = exercise.duracion_minutos;
    if (duracionMinutos === undefined && exercise.duracion_segundos) {
      duracionMinutos = exercise.duracion_segundos / 60;
    }
    features.push(this._normalizeMinutes(duracionMinutos || 10, 1, 60));

    // Dificultad: acepta formato plano (dificultad_X) o anidado (dificultad.X)
    const getDifficulty = (type) => {
      // Formato plano: dificultad_tactica, dificultad_tecnica, etc.
      if (exercise[`dificultad_${type}`] !== undefined) {
        return exercise[`dificultad_${type}`];
      }
      // Formato anidado: dificultad.tactica, dificultad.tecnica, etc.
      if (exercise.dificultad && exercise.dificultad[type] !== undefined) {
        return exercise.dificultad[type];
      }
      return 3; // Default
    };

    features.push(this._normalizeDifficulty(getDifficulty('tactica')));
    features.push(this._normalizeDifficulty(getDifficulty('tecnica')));
    features.push(this._normalizeDifficulty(getDifficulty('fisica')));
    features.push(this._normalizeDifficulty(getDifficulty('mental')));

    if (this.vocabularyEncoders.tags) {
      features.push(...this.vocabularyEncoders.tags.encode(exercise.etiquetas || []));
    }

    return features;
  }

  getExerciseIdIndex(exerciseId) {
    if (this.vocabularyEncoders.exerciseId) {
      return this.vocabularyEncoders.exerciseId.getIndex(exerciseId);
    }
    return 0;
  }

  _normalizeMinutes(value, min, max) {
    return (value - min) / (max - min);
  }

  _normalizeCount(value, min, max) {
    return (value - min) / (max - min);
  }

  _normalizeDifficulty(value) {
    return (value - 1) / 4;
  }

  // ============================================================================
  // PREDICCIÓN
  // ============================================================================

  async predict(context, exercise) {
    if (!this.isInitialized) {
      throw new Error('Model not initialized. Call buildModel() first.');
    }

    const contextFeatures = this.encodeContextFeatures(context);
    const exerciseFeatures = this.encodeExerciseFeatures(exercise);
    const exerciseIdIndex = this.getExerciseIdIndex(exercise.id);

    const contextTensor = tf.tensor2d([contextFeatures]);
    const exerciseFeaturesTensor = tf.tensor2d([exerciseFeatures]);
    const exerciseIdTensor = tf.tensor2d([[exerciseIdIndex]], [1, 1], 'int32');

    try {
      const prediction = this.rankingModel.predict([
        contextTensor,
        exerciseFeaturesTensor,
        exerciseIdTensor,
      ]);

      const score = await prediction.data();

      contextTensor.dispose();
      exerciseFeaturesTensor.dispose();
      exerciseIdTensor.dispose();
      prediction.dispose();

      return score[0];
    } catch (error) {
      contextTensor.dispose();
      exerciseFeaturesTensor.dispose();
      exerciseIdTensor.dispose();
      throw error;
    }
  }

  async predictBatch(context, exercises) {
    if (!this.isInitialized) {
      throw new Error('Model not initialized. Call buildModel() first.');
    }

    const contextFeatures = this.encodeContextFeatures(context);
    const batchSize = exercises.length;

    const contextBatch = [];
    const exerciseFeaturesBatch = [];
    const exerciseIdBatch = [];

    for (const exercise of exercises) {
      contextBatch.push(contextFeatures);
      exerciseFeaturesBatch.push(this.encodeExerciseFeatures(exercise));
      exerciseIdBatch.push([this.getExerciseIdIndex(exercise.id)]);
    }

    const contextTensor = tf.tensor2d(contextBatch);
    const exerciseFeaturesTensor = tf.tensor2d(exerciseFeaturesBatch);
    const exerciseIdTensor = tf.tensor2d(exerciseIdBatch, [batchSize, 1], 'int32');

    try {
      const predictions = this.rankingModel.predict([
        contextTensor,
        exerciseFeaturesTensor,
        exerciseIdTensor,
      ]);

      const scores = await predictions.data();

      contextTensor.dispose();
      exerciseFeaturesTensor.dispose();
      exerciseIdTensor.dispose();
      predictions.dispose();

      return Array.from(scores);
    } catch (error) {
      contextTensor.dispose();
      exerciseFeaturesTensor.dispose();
      exerciseIdTensor.dispose();
      throw error;
    }
  }

  // ============================================================================
  // GUARDAR/CARGAR MODELO
  // ============================================================================

  /**
   * Crea un IOHandler para guardar el modelo en archivos
   */
  _createFileSaveHandler(dirPath) {
    const fs = require('fs').promises;
    const path = require('path');

    return {
      save: async (modelArtifacts) => {
        // Guardar topology (model.json)
        const modelJSON = {
          modelTopology: modelArtifacts.modelTopology,
          format: modelArtifacts.format,
          generatedBy: modelArtifacts.generatedBy,
          convertedBy: modelArtifacts.convertedBy,
          weightsManifest: [
            {
              paths: ['weights.bin'],
              weights: modelArtifacts.weightSpecs,
            },
          ],
        };

        await fs.writeFile(path.join(dirPath, 'model.json'), JSON.stringify(modelJSON, null, 2));

        // Guardar weights como binary
        if (modelArtifacts.weightData) {
          const weightBuffer = Buffer.from(modelArtifacts.weightData);
          await fs.writeFile(path.join(dirPath, 'weights.bin'), weightBuffer);
        }

        return {
          modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: 'JSON',
          },
        };
      },
    };
  }

  /**
   * Crea un IOHandler para cargar el modelo desde archivos
   */
  _createFileLoadHandler(dirPath) {
    const fs = require('fs').promises;
    const path = require('path');

    return {
      load: async () => {
        // Cargar model.json
        const modelJSONPath = path.join(dirPath, 'model.json');
        const modelJSON = JSON.parse(await fs.readFile(modelJSONPath, 'utf-8'));

        // Cargar weights
        const weightsPath = path.join(dirPath, 'weights.bin');
        const weightsBuffer = await fs.readFile(weightsPath);
        const weightData = new Uint8Array(weightsBuffer).buffer;

        return {
          modelTopology: modelJSON.modelTopology,
          weightSpecs: modelJSON.weightsManifest[0].weights,
          weightData: weightData,
          format: modelJSON.format,
          generatedBy: modelJSON.generatedBy,
          convertedBy: modelJSON.convertedBy,
        };
      },
    };
  }

  async saveModel(path = config.paths.modelDir) {
    if (!this.isInitialized) {
      throw new Error('Model not initialized');
    }

    const fs = require('fs').promises;
    const pathModule = require('path');
    const fullPath = pathModule.resolve(__dirname, path);

    await fs.mkdir(fullPath, { recursive: true });

    // Usar IOHandler personalizado
    await this.rankingModel.save(this._createFileSaveHandler(fullPath));

    const vocabPath = pathModule.join(fullPath, 'vocabulary.json');
    const vocabularyData = {
      encoders: Object.keys(this.vocabularyEncoders).reduce((acc, key) => {
        const encoder = this.vocabularyEncoders[key];
        acc[key] = {
          size: encoder.size,
          type: encoder.encode ? 'categorical' : 'embedding',
        };
        return acc;
      }, {}),
      isTrained: this.isTrained,
    };

    await fs.writeFile(vocabPath, JSON.stringify(vocabularyData, null, 2));
    console.log(`Model saved to ${fullPath}`);
  }

  async loadModel(path = config.paths.modelDir) {
    const pathModule = require('path');
    const fs = require('fs').promises;
    const fullPath = pathModule.resolve(__dirname, path);

    // Usar IOHandler personalizado
    this.rankingModel = await tf.loadLayersModel(this._createFileLoadHandler(fullPath));

    const vocabPath = pathModule.join(fullPath, 'vocabulary.json');
    const vocabularyData = JSON.parse(await fs.readFile(vocabPath, 'utf-8'));

    this.isTrained = vocabularyData.isTrained;
    this.isInitialized = true;

    console.log(`Model loaded from ${fullPath}`);
  }

  getModelSummary() {
    return {
      version: config.modelVersion,
      description: config.description,
      isInitialized: this.isInitialized,
      isTrained: this.isTrained,
      architecture: config.architecture,
      vocabularySizes: Object.keys(this.vocabularyEncoders).reduce((acc, key) => {
        acc[key] = this.vocabularyEncoders[key]?.size || 0;
        return acc;
      }, {}),
    };
  }
}

module.exports = TFRSRankingModel;
