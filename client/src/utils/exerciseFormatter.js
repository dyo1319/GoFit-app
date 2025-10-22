import { formatToHebrewDate } from './dateFormatter';

export const formatExerciseData = (exercise) => {
  if (!exercise) return null;

  return {
    ...exercise,
    difficulty_he: getDifficultyHebrew(exercise.difficulty),
    created_at: formatToHebrewDate(exercise.created_at),
    updated_at: formatToHebrewDate(exercise.updated_at)
  };
};

export const formatExercisesData = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  return exercises.map(formatExerciseData);
};

export const getDifficultyHebrew = (difficulty) => {
  const difficultyMap = {
    'beginner': 'מתחיל',
    'intermediate': 'בינוני', 
    'advanced': 'מתקדם'
  };
  return difficultyMap[difficulty] || difficulty;
};

export const getMuscleGroupHebrew = (muscleGroup) => {
  const muscleGroupMap = {
    'chest': 'חזה',
    'back': 'גב',
    'legs': 'רגליים',
    'arms': 'ידיים',
    'shoulders': 'כתפיים',
    'core': 'בטן',
    'full-body': 'גוף מלא'
  };
  return muscleGroupMap[muscleGroup] || muscleGroup;
};