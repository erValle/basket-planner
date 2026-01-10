const exerciseScorer = require('../../src/recommender/models/rec-0.1.0-baseline/exerciseScorer');
const config = require('../../src/recommender/models/rec-0.1.0-baseline/config');

describe('ExerciseScorer - Dynamic Difficulty Weighting', () => {
  describe('getDimensionWeights()', () => {
    it('should return default weights when no objectives provided', () => {
      const weights = exerciseScorer.getDimensionWeights();
      
      expect(weights).toEqual(config.objectiveToDimensionWeights.default);
      
      // Verify sum equals 1.0
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should return correct weights for single objective "shooting"', () => {
      const weights = exerciseScorer.getDimensionWeights(['shooting']);
      
      expect(weights).toEqual(config.objectiveToDimensionWeights.shooting);
      
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should return correct weights for single objective "conditioning"', () => {
      const weights = exerciseScorer.getDimensionWeights(['conditioning']);
      
      expect(weights).toEqual(config.objectiveToDimensionWeights.conditioning);
      
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should return correct weights for single objective "tactics"', () => {
      const weights = exerciseScorer.getDimensionWeights(['tactics']);
      
      expect(weights).toEqual(config.objectiveToDimensionWeights.tactics);
      
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should average weights for multiple objectives', () => {
      const weights = exerciseScorer.getDimensionWeights(['shooting', 'conditioning']);
      
      // shooting: {tactica:0.1, tecnica:0.5, fisica:0.2, mental:0.2}
      // conditioning: {tactica:0.05, tecnica:0.1, fisica:0.7, mental:0.15}
      // average: {tactica:0.075, tecnica:0.3, fisica:0.45, mental:0.175}
      
      expect(weights.tactica).toBeCloseTo(0.075, 5);
      expect(weights.tecnica).toBeCloseTo(0.3, 5);
      expect(weights.fisica).toBeCloseTo(0.45, 5);
      expect(weights.mental).toBeCloseTo(0.175, 5);
      
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should handle all objectives correctly', () => {
      const objectives = Object.keys(config.objectiveToDimensionWeights).filter(k => k !== 'default');
      
      objectives.forEach(objective => {
        const weights = exerciseScorer.getDimensionWeights([objective]);
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        
        expect(sum).toBeCloseTo(1.0, 5);
        expect(weights).toHaveProperty('tactica');
        expect(weights).toHaveProperty('tecnica');
        expect(weights).toHaveProperty('fisica');
        expect(weights).toHaveProperty('mental');
      });
    });

    it('should ignore unknown objectives and use default weights', () => {
      const weights = exerciseScorer.getDimensionWeights(['unknown-objective']);
      
      expect(weights).toEqual(config.objectiveToDimensionWeights.default);
    });

    it('should mix known and unknown objectives correctly', () => {
      const weights = exerciseScorer.getDimensionWeights(['shooting', 'unknown']);
      
      // Only 'shooting' should contribute
      expect(weights).toEqual(config.objectiveToDimensionWeights.shooting);
    });
  });

  describe('scoreDifficultyFit()', () => {
    it('should prioritize technical dimension for shooting objective', () => {
      const technicalExercise = {
        tactica: 1,
        tecnica: 5,  // High technical difficulty
        fisica: 1,
        mental: 1
      };
      
      const physicalExercise = {
        tactica: 1,
        tecnica: 1,
        fisica: 5,  // High physical difficulty
        mental: 1
      };
      
      const playerLevel = 'intermediate';
      const intensity = 'medium';
      const objectives = ['shooting'];
      
      const technicalScore = exerciseScorer.scoreDifficultyFit(
        technicalExercise, 
        playerLevel,
        intensity,
        objectives
      );
      
      const physicalScore = exerciseScorer.scoreDifficultyFit(
        physicalExercise, 
        playerLevel,
        intensity,
        objectives
      );
      
      // For shooting, technical exercise should score better or equal
      expect(technicalScore).toBeGreaterThanOrEqual(physicalScore);
    });

    it('should prioritize physical dimension for conditioning objective', () => {
      const technicalExercise = {
        tactica: 1,
        tecnica: 5,
        fisica: 1,
        mental: 1
      };
      
      const physicalExercise = {
        tactica: 1,
        tecnica: 1,
        fisica: 5,
        mental: 1
      };
      
      const playerLevel = 'advanced';
      const intensity = 'high';
      const objectives = ['conditioning'];
      
      const technicalScore = exerciseScorer.scoreDifficultyFit(
        technicalExercise, 
        playerLevel,
        intensity,
        objectives
      );
      
      const physicalScore = exerciseScorer.scoreDifficultyFit(
        physicalExercise, 
        playerLevel,
        intensity,
        objectives
      );
      
      // For conditioning, physical exercise should score better or equal
      expect(physicalScore).toBeGreaterThanOrEqual(technicalScore);
    });

    it('should prioritize tactical dimension for tactics objective', () => {
      const tacticalExercise = {
        tactica: 5,  // High tactical difficulty
        tecnica: 1,
        fisica: 1,
        mental: 1
      };
      
      const technicalExercise = {
        tactica: 1,
        tecnica: 5,
        fisica: 1,
        mental: 1
      };
      
      const playerLevel = 'intermediate';
      const intensity = 'medium';
      const objectives = ['tactics'];
      
      const tacticalScore = exerciseScorer.scoreDifficultyFit(
        tacticalExercise, 
        playerLevel,
        intensity,
        objectives
      );
      
      const technicalScore = exerciseScorer.scoreDifficultyFit(
        technicalExercise, 
        playerLevel,
        intensity,
        objectives
      );
      
      // For tactics, tactical exercise should score better or equal
      expect(tacticalScore).toBeGreaterThanOrEqual(technicalScore);
    });

    it('should handle missing difficulty dimensions gracefully', () => {
      const incompleteExercise = {
        tactica: 3,
        tecnica: 4
        // Missing fisica and mental
      };
      
      const playerLevel = 'intermediate';
      const intensity = 'medium';
      
      // Should not throw error
      expect(() => {
        exerciseScorer.scoreDifficultyFit(incompleteExercise, playerLevel, intensity);
      }).not.toThrow();
      
      const score = exerciseScorer.scoreDifficultyFit(incompleteExercise, playerLevel, intensity);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return score between 0 and 1', () => {
      const exercise = {
        tactica: 5,
        tecnica: 5,
        fisica: 5,
        mental: 5
      };
      
      const playerLevel = 'beginner';  // Very different from exercise
      const intensity = 'low';
      
      const score = exerciseScorer.scoreDifficultyFit(exercise, playerLevel, intensity);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should work with multiple objectives', () => {
      const exercise = {
        tactica: 4,
        tecnica: 4,
        fisica: 4,
        mental: 3
      };
      
      const objectives = ['shooting', 'tactics', 'conditioning'];
      const score = exerciseScorer.scoreDifficultyFit(exercise, 'advanced', 'high', objectives);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration with config', () => {
    it('should have objectiveToDimensionWeights defined in config', () => {
      expect(config.objectiveToDimensionWeights).toBeDefined();
      expect(typeof config.objectiveToDimensionWeights).toBe('object');
    });

    it('should have default weights in config', () => {
      expect(config.objectiveToDimensionWeights.default).toBeDefined();
      const defaultWeights = config.objectiveToDimensionWeights.default;
      
      expect(defaultWeights.tactica).toBe(0.25);
      expect(defaultWeights.tecnica).toBe(0.25);
      expect(defaultWeights.fisica).toBe(0.25);
      expect(defaultWeights.mental).toBe(0.25);
    });

    it('should have all dimension weights sum to 1.0 for each objective', () => {
      Object.entries(config.objectiveToDimensionWeights).forEach(([objective, weights]) => {
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 5);
      });
    });

    it('should have all required dimensions for each objective', () => {
      const requiredDimensions = ['tactica', 'tecnica', 'fisica', 'mental'];
      
      Object.entries(config.objectiveToDimensionWeights).forEach(([objective, weights]) => {
        requiredDimensions.forEach(dimension => {
          expect(weights[dimension]).toBeDefined();
          expect(typeof weights[dimension]).toBe('number');
          expect(weights[dimension]).toBeGreaterThanOrEqual(0);
          expect(weights[dimension]).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should have shooting prioritize technical dimension', () => {
      const shootingWeights = config.objectiveToDimensionWeights.shooting;
      expect(shootingWeights.tecnica).toBeGreaterThan(shootingWeights.tactica);
      expect(shootingWeights.tecnica).toBeGreaterThan(shootingWeights.fisica);
      expect(shootingWeights.tecnica).toBeGreaterThan(shootingWeights.mental);
    });

    it('should have conditioning prioritize physical dimension', () => {
      const conditioningWeights = config.objectiveToDimensionWeights.conditioning;
      expect(conditioningWeights.fisica).toBeGreaterThan(conditioningWeights.tactica);
      expect(conditioningWeights.fisica).toBeGreaterThan(conditioningWeights.tecnica);
      expect(conditioningWeights.fisica).toBeGreaterThan(conditioningWeights.mental);
    });

    it('should have tactics prioritize tactical dimension', () => {
      const tacticsWeights = config.objectiveToDimensionWeights.tactics;
      expect(tacticsWeights.tactica).toBeGreaterThan(tacticsWeights.tecnica);
      expect(tacticsWeights.tactica).toBeGreaterThan(tacticsWeights.fisica);
      expect(tacticsWeights.tactica).toBeGreaterThan(tacticsWeights.mental);
    });
  });
});
