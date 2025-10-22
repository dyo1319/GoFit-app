import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Box, Typography, Alert,
  Chip, Card, CardContent, Tab, Tabs, Accordion, AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Add, Edit, Delete, FitnessCenter, People,
  Search, Assignment, ExpandMore, Visibility
} from '@mui/icons-material';
import { makeFieldChange } from '../../utils/formHelpers';
import { initialTrainingProgramForm } from '../../utils/formDefaults';
import { validateTrainingProgramForm } from '../../utils/validators';
import { formatToHebrewDate } from '../../utils/dateFormatter';
import './TrainingPrograms.css';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export default function TrainingPrograms() {
  const { authenticatedFetch, hasPermission } = useAuth();
  const [trainees, setTrainees] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [userPrograms, setUserPrograms] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [form, setForm] = useState(initialTrainingProgramForm);
  const [errors, setErrors] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editExerciseDialog, setEditExerciseDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    exercise_id: '',
    sets: '',
    reps: '',
    duration: 0
  });

  const handleFieldChange = makeFieldChange(setForm, setErrors);

  useEffect(() => {
    fetchTrainees();
    fetchExercises();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPrograms(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchTrainees = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/training-programs/trainees');
      const data = await response.json();
      
      if (data.success) {
        setTrainees(data.data);
      } else {
        setError('נכשל בטעינת המתאמנים');
      }
    } catch (err) {
      setError('שגיאה בטעינת המתאמנים: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await authenticatedFetch('/exercises');
      const data = await response.json();
      
      if (data.success) {
        setExercises(data.data);
      }
    } catch (err) {
      console.error('Error loading exercises:', err);
    }
  };

  const fetchUserPrograms = async (userId) => {
    try {
      const response = await authenticatedFetch(`/training-programs/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUserPrograms(data.data);
      }
    } catch (err) {
      console.error('Error loading user programs:', err);
    }
  };

  const handleCreateProgram = (trainee) => {
    setSelectedTrainee(trainee);
    setForm({
      program_name: `תוכנית אימונים - ${trainee.username}`,
      user_id: trainee.id,
      exercises: [{ exercise_id: '', sets: '', reps: '', duration: 0 }]
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateTrainingProgramForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const response = await authenticatedFetch('/training-programs', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (data.success) {
        setOpenDialog(false);
        setForm(initialTrainingProgramForm);
        fetchTrainees();
        setSuccess('התוכנית נוצרה בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
        
        if (selectedUserId === form.user_id) {
          fetchUserPrograms(form.user_id);
        }
      } else {
        setError(data.message || 'יצירת התוכנית נכשלה');
      }
    } catch (err) {
      setError('שגיאה ביצירת התוכנית: ' + err.message);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תוכנית זו?')) return;

    try {
      const response = await authenticatedFetch(`/training-programs/${programId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchTrainees();
        if (selectedUserId) {
          fetchUserPrograms(selectedUserId);
        }
        setSuccess('התוכנית נמחקה בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'מחיקת התוכנית נכשלה');
      }
    } catch (err) {
      setError('שגיאה במחיקת התוכנית: ' + err.message);
    }
  };

  const addExercise = () => {
    setForm({
      ...form,
      exercises: [...form.exercises, { exercise_id: '', sets: '', reps: '', duration: 0 }]
    });
  };

  const removeExercise = (index) => {
    const newExercises = form.exercises.filter((_, i) => i !== index);
    setForm({ ...form, exercises: newExercises });
  };

  const updateExercise = (index, field, value) => {
    const newExercises = [...form.exercises];
    newExercises[index][field] = value;
    setForm({ ...form, exercises: newExercises });
    
    if (errors[`exercises[${index}].${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`exercises[${index}].${field}`];
      setErrors(newErrors);
    }
  };

  const viewUserPrograms = (trainee) => {
    setSelectedUserId(trainee.id);
    setTabValue(1);
  };

  const getDifficultyHebrew = (difficulty) => {
    const difficultyMap = {
      'beginner': 'מתחיל',
      'intermediate': 'בינוני', 
      'advanced': 'מתקדם'
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const handleEditExercise = (programId, exercise, index) => {
    setEditingProgramId(programId);
    setEditingExercise(exercise);
    setEditingExerciseIndex(index);
    setExerciseForm({
      exercise_id: exercise.id,
      sets: exercise.sets,
      reps: exercise.reps,
      duration: exercise.duration || 0
    });
    setEditExerciseDialog(true);
  };

  const handleAddExerciseToProgram = (programId) => {
    setEditingProgramId(programId);
    setEditingExercise(null);
    setEditingExerciseIndex(null);
    setExerciseForm({
      exercise_id: '',
      sets: '',
      reps: '',
      duration: 0
    });
    setEditExerciseDialog(true);
  };

  const handleDeleteExercise = async (programId, exerciseId, index) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תרגיל זה מהתוכנית?')) return;

    try {
      const response = await authenticatedFetch(`/training-programs/${programId}/exercises/${exerciseId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchUserPrograms(selectedUserId);
        setSuccess('התרגיל נמחק מהתוכנית בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'מחיקת התרגיל נכשלה');
      }
    } catch (err) {
      setError('שגיאה במחיקת התרגיל: ' + err.message);
    }
  };

  const handleExerciseSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingExercise 
        ? `/training-programs/${editingProgramId}/exercises/${editingExercise.training_exercise_id}`
        : `/training-programs/${editingProgramId}/exercises`;
      
      const method = editingExercise ? 'PUT' : 'POST';

      // Ensure all form data is properly formatted
      const formData = editingExercise 
        ? {
            // For editing, don't change the exercise_id, only update parameters
            sets: exerciseForm.sets || '1',
            reps: exerciseForm.reps || '1',
            duration: parseInt(exerciseForm.duration) || 0
          }
        : {
            // For adding new exercise, include exercise_id
            exercise_id: parseInt(exerciseForm.exercise_id) || null,
            sets: exerciseForm.sets || '1',
            reps: exerciseForm.reps || '1',
            duration: parseInt(exerciseForm.duration) || 0
          };

      const response = await authenticatedFetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setEditExerciseDialog(false);
        fetchUserPrograms(selectedUserId);
        setSuccess(editingExercise ? 'התרגיל עודכן בהצלחה' : 'התרגיל נוסף לתוכנית בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'הפעולה נכשלה');
      }
    } catch (err) {
      setError('שגיאה בשמירת התרגיל: ' + err.message);
    }
  };

  if (loading) return <div className="loading">טוען מתאמנים...</div>;

  return (
    <div className="training-programs-admin">
      <div className="page-container">
      <div className="page-header">
        <Typography variant="h4" component="h1" gutterBottom>
          <Assignment sx={{ mr: 1 }} />
          תוכניות אימון
        </Typography>
        <Typography variant="body1" color="textSecondary">
          ניהול והקצאת תוכניות אימון למתאמנים
        </Typography>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab icon={<People />} label="רשימת מתאמנים" />
            <Tab 
              icon={<FitnessCenter />} 
              label={`תוכניות ${selectedUserId ? 'מתאמן' : 'פעילות'}`} 
              disabled={!selectedUserId && tabValue === 1}
            />
          </Tabs>
        </CardContent>
      </Card>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מתאמן</TableCell>
                <TableCell>טלפון</TableCell>
                <TableCell>מספר תוכניות</TableCell>
                <TableCell>תוכנית אחרונה</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trainees.map((trainee) => (
                <TableRow key={trainee.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{trainee.username}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {trainee.gender === 'male' ? 'גבר' : 'אישה'}
                    </Typography>
                  </TableCell>
                  <TableCell>{trainee.phone}</TableCell>
                  <TableCell>
                    <Chip 
                      label={trainee.program_count} 
                      color={trainee.program_count > 0 ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {trainee.latest_program_date ? 
                      formatToHebrewDate(trainee.latest_program_date) : 
                      'אין תוכניות'
                    }
                  </TableCell>
                  <TableCell>
                    {hasPermission('manage_plans') && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleCreateProgram(trainee)}
                          startIcon={<Add />}
                        >
                          תוכנית חדשה
                        </Button>
                        {trainee.program_count > 0 && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => viewUserPrograms(trainee)}
                            startIcon={<Visibility />}
                          >
                            צפייה בתוכניות
                          </Button>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {trainees.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              אין מתאמנים במערכת
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box className="back-button">
          <Typography variant="h6">
            תוכניות אימון - {trainees.find(t => t.id === selectedUserId)?.username}
          </Typography>
          <Button onClick={() => setTabValue(0)}>
            חזרה לרשימת מתאמנים
          </Button>
        </Box>

        {userPrograms.length === 0 ? (
          <Alert severity="info">
            לא נמצאו תוכניות אימון למתאמן זה
          </Alert>
        ) : (
          userPrograms.map((program) => (
            <Accordion key={program.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box className="program-header">
                  <Typography className="program-title">
                    {program.program_name}
                  </Typography>
                  <Box className="program-meta">
                    <Chip 
                      label={`${program.exercises?.length || 0} תרגילים`} 
                      size="small" 
                      className="program-count-chip"
                    />
                    <Typography className="program-creator">
                      נוצר על ידי: {program.created_by_name}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    נוצר ב: {formatToHebrewDate(program.created_at)}
                  </Typography>
                  {hasPermission('manage_plans') && (
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteProgram(program.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>תרגיל</TableCell>
                        <TableCell>קטגוריה</TableCell>
                        <TableCell>קבוצת שרירים</TableCell>
                        <TableCell>סטים</TableCell>
                        <TableCell>חזרות</TableCell>
                        <TableCell>משך (דקות)</TableCell>
                        <TableCell>רמת קושי</TableCell>
                        <TableCell>פעולות</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {program.exercises?.map((exercise, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {exercise.exercise_name}
                            </Typography>
                            {exercise.description && (
                              <Typography variant="body2" color="textSecondary">
                                {exercise.description.substring(0, 60)}...
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={exercise.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{exercise.muscle_group || '-'}</TableCell>
                          <TableCell>{exercise.sets}</TableCell>
                          <TableCell>{exercise.reps}</TableCell>
                          <TableCell>{exercise.duration || 0}</TableCell>
                          <TableCell>
                            {exercise.difficulty && (
                              <Chip 
                                label={getDifficultyHebrew(exercise.difficulty)}
                                size="small"
                                color={
                                  exercise.difficulty === 'beginner' ? 'success' :
                                  exercise.difficulty === 'intermediate' ? 'warning' : 'error'
                                }
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {hasPermission('manage_plans') && (
                              <Box className="exercise-actions">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditExercise(program.id, exercise, index)}
                                  color="primary"
                                  title="עריכת תרגיל"
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteExercise(program.id, exercise.training_exercise_id, index)}
                                  color="error"
                                  title="מחיקת תרגיל"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {hasPermission('manage_plans') && (
                  <Box className="add-exercise-button">
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => handleAddExerciseToProgram(program.id)}
                      size="small"
                    >
                      הוסף תרגיל לתוכנית
                    </Button>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </TabPanel>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          תוכנית אימון חדשה - {selectedTrainee?.username}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="שם התוכנית"
                value={form.program_name}
                onChange={(e) => handleFieldChange('program_name', e.target.value)}
                error={!!errors.program_name}
                helperText={errors.program_name}
                required
                fullWidth
              />

              <Box>
                <Typography variant="h6" gutterBottom>
                  תרגילים בתוכנית
                </Typography>
                {errors.exercises && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.exercises}
                  </Alert>
                )}
                
                {form.exercises.map((exercise, index) => (
                  <Card key={index} className={`exercise-card ${errors[`exercises[${index}].exercise_id`] ? 'error' : ''}`}>
                    <Box className="exercise-card-header">
                      <TextField
                        select
                        label="תרגיל"
                        value={exercise.exercise_id}
                        onChange={(e) => updateExercise(index, 'exercise_id', e.target.value)}
                        error={!!errors[`exercises[${index}].exercise_id`]}
                        helperText={errors[`exercises[${index}].exercise_id`]}
                        required
                        sx={{ minWidth: 250 }}
                      >
                        <MenuItem value="">בחר תרגיל</MenuItem>
                        {exercises.map(ex => (
                          <MenuItem key={ex.id} value={ex.id}>
                            {ex.exercise_name} ({ex.category})
                          </MenuItem>
                        ))}
                      </TextField>

                      <Box className="exercise-card-fields">
                        <TextField
                          label="סטים"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                          error={!!errors[`exercises[${index}].sets`]}
                          helperText={errors[`exercises[${index}].sets`]}
                          placeholder="3-4"
                          required
                        />

                        <TextField
                          label="חזרות"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          error={!!errors[`exercises[${index}].reps`]}
                          helperText={errors[`exercises[${index}].reps`]}
                          placeholder="8-12"
                          required
                        />

                        <TextField
                          label="משך (דקות)"
                          type="number"
                          value={exercise.duration}
                          onChange={(e) => updateExercise(index, 'duration', parseInt(e.target.value) || 0)}
                        />
                      </Box>

                      {form.exercises.length > 1 && (
                        <IconButton 
                          onClick={() => removeExercise(index)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>

                    {exercise.exercise_id && (
                      <Box className="exercise-info">
                        {(() => {
                          const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);
                          return selectedExercise ? (
                            <Typography variant="body2" color="textSecondary">
                              <strong>תיאור:</strong> {selectedExercise.description || 'אין תיאור'} | 
                              <strong> ציוד:</strong> {selectedExercise.equipment || 'אין'} |
                              <strong> קושי:</strong> {getDifficultyHebrew(selectedExercise.difficulty)}
                            </Typography>
                          ) : null;
                        })()}
                      </Box>
                    )}
                  </Card>
                ))}

                <Button
                  onClick={addExercise}
                  startIcon={<Add />}
                  variant="outlined"
                >
                  הוסף תרגיל
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={form.exercises.length === 0}
            >
              צור תוכנית
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Exercise Edit Dialog */}
      <Dialog open={editExerciseDialog} onClose={() => setEditExerciseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExercise ? 'עריכת תרגיל בתוכנית' : 'הוספת תרגיל לתוכנית'}
        </DialogTitle>
        <form onSubmit={handleExerciseSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="תרגיל"
                value={exerciseForm.exercise_id}
                onChange={(e) => setExerciseForm({...exerciseForm, exercise_id: e.target.value})}
                required
                fullWidth
                disabled={editingExercise} // Disable when editing existing exercise
              >
                <MenuItem value="">בחר תרגיל</MenuItem>
                {exercises.map(ex => (
                  <MenuItem key={ex.id} value={ex.id}>
                    {ex.exercise_name} ({ex.category})
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="סטים"
                  value={exerciseForm.sets}
                  onChange={(e) => setExerciseForm({...exerciseForm, sets: e.target.value})}
                  placeholder="3-4"
                  required
                  sx={{ flex: 1 }}
                />

                <TextField
                  label="חזרות"
                  value={exerciseForm.reps}
                  onChange={(e) => setExerciseForm({...exerciseForm, reps: e.target.value})}
                  placeholder="8-12"
                  required
                  sx={{ flex: 1 }}
                />

                <TextField
                  label="משך (דקות)"
                  type="number"
                  value={exerciseForm.duration}
                  onChange={(e) => setExerciseForm({...exerciseForm, duration: parseInt(e.target.value) || 0})}
                  sx={{ flex: 1 }}
                />
              </Box>

              {exerciseForm.exercise_id && (
                <Box sx={{ mt: 1, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  {(() => {
                    const selectedExercise = exercises.find(ex => ex.id === exerciseForm.exercise_id);
                    return selectedExercise ? (
                      <Typography variant="body2" color="textSecondary">
                        <strong>תיאור:</strong> {selectedExercise.description || 'אין תיאור'} | 
                        <strong> ציוד:</strong> {selectedExercise.equipment || 'אין'} |
                        <strong> קושי:</strong> {getDifficultyHebrew(selectedExercise.difficulty)}
                      </Typography>
                    ) : null;
                  })()}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setEditExerciseDialog(false)}>ביטול</Button>
            <Button type="submit" variant="contained">
              {editingExercise ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      </div>
    </div>
  );
}