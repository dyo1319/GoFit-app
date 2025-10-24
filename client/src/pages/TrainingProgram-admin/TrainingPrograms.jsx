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

  const getAvailableExercises = (programId) => {
    if (!programId || !userPrograms.length) return exercises;
    
    const currentProgram = userPrograms.find(program => program.id === programId);
    if (!currentProgram || !currentProgram.exercises) return exercises;
    
    const usedExerciseIds = currentProgram.exercises.map(ex => parseInt(ex.id));
    
    if (exerciseForm.exercise_id && exerciseForm.exercise_id !== '') {
      const currentExerciseId = parseInt(exerciseForm.exercise_id);
      const filteredUsedIds = usedExerciseIds.filter(id => id !== currentExerciseId);
      const availableExercises = exercises.filter(exercise => !filteredUsedIds.includes(parseInt(exercise.id)));
      return availableExercises;
    }
    
    const availableExercises = exercises.filter(exercise => !usedExerciseIds.includes(parseInt(exercise.id)));
    return availableExercises;
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

      const formData = editingExercise 
        ? {
            sets: exerciseForm.sets || '1',
            reps: exerciseForm.reps || '1',
            duration: parseInt(exerciseForm.duration) || 0
          }
        : {
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
        if (response.status === 409) {
          setError('התרגיל כבר קיים בתוכנית זו. אנא בחר תרגיל אחר.');
        } else {
          setError(data.message || 'הפעולה נכשלה');
        }
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
                <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>פעולות</TableCell>
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
                  <TableCell sx={{ textAlign: 'center' }}>
                    {hasPermission('manage_plans') && (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 1, 
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleCreateProgram(trainee)}
                          sx={{
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s ease',
                            minWidth: '120px',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                            }
                          }}
                        >
                          תוכנית חדשה
                        </Button>
                        {trainee.program_count > 0 && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => viewUserPrograms(trainee)}
                            sx={{
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              border: '2px solid #6366f1',
                              color: '#6366f1',
                              backgroundColor: 'rgba(99, 102, 241, 0.05)',
                              transition: 'all 0.2s ease',
                              minWidth: '120px',
                              '&:hover': {
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                borderColor: '#5b5bd6',
                                color: '#5b5bd6',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(99, 102, 241, 0.2)'
                              }
                            }}
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
                          <TableCell sx={{ textAlign: 'center' }}>
                            {hasPermission('manage_plans') && (
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditExercise(program.id, exercise, index)}
                                  title="עריכת תרגיל"
                                  sx={{
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366f1',
                                    borderRadius: '8px',
                                    padding: '6px',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                      transform: 'scale(1.1)',
                                      boxShadow: '0 4px 8px rgba(99, 102, 241, 0.3)'
                                    }
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteExercise(program.id, exercise.training_exercise_id, index)}
                                  title="מחיקת תרגיל"
                                  sx={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    borderRadius: '8px',
                                    padding: '6px',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                      transform: 'scale(1.1)',
                                      boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
                                    }
                                  }}
                                >
                                  <Delete fontSize="small" />
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
                  <Box sx={{ 
                    marginTop: '16px', 
                    display: 'flex', 
                    justifyContent: 'center'
                  }}>
                    <Button
                      variant="contained"
                      onClick={() => handleAddExerciseToProgram(program.id)}
                      size="small"
                      sx={{
                        borderRadius: '12px',
                        padding: '10px 20px',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)'
                        }
                      }}
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

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="lg" 
        fullWidth
        disableEnforceFocus={false}
        disableAutoFocus={true}
        disableRestoreFocus={false}
        disableScrollLock={false}
        hideBackdrop={false}
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: 'blur(10px)',
            maxWidth: '800px',
            width: '95%',
            direction: 'rtl',
            textAlign: 'right'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{
          padding: '24px 24px 16px',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'white',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '12px 12px 0 0',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          direction: 'rtl',
          textAlign: 'right',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '12px 12px 0 0'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row-reverse' }}>
            <Assignment sx={{ fontSize: '1.5rem' }} />
            תוכנית אימון חדשה - {selectedTrainee?.username}
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ 
            padding: '24px',
            backgroundColor: '#ffffff',
            direction: 'rtl'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                id="program_name"
                name="program_name"
                label="שם התוכנית"
                value={form.program_name}
                onChange={(e) => handleFieldChange('program_name', e.target.value)}
                error={!!errors.program_name}
                helperText={errors.program_name}
                required
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    display: 'none'
                  },
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                    direction: 'rtl',
                    padding: '16px 20px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '12px',
                    border: '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:focus': {
                      backgroundColor: '#ffffff',
                      borderColor: '#6366f1',
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(248, 250, 252, 1)',
                      borderColor: 'rgba(99, 102, 241, 0.3)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    position: 'static',
                    transform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px',
                    textAlign: 'right',
                    direction: 'rtl'
                  },
                  '& .MuiFormHelperText-root': {
                    textAlign: 'right',
                    direction: 'rtl',
                    marginTop: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }
                }}
              />

              <Box>
                <Typography variant="h6" gutterBottom sx={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '16px',
                  textAlign: 'right',
                  direction: 'rtl',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexDirection: 'row-reverse'
                }}>
                  <FitnessCenter sx={{ fontSize: '1.25rem', color: '#6366f1' }} />
                  תרגילים בתוכנית
                </Typography>
                {errors.exercises && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.exercises}
                  </Alert>
                )}
                
                {form.exercises.map((exercise, index) => (
                  <Card key={index} sx={{
                    border: errors[`exercises[${index}].exercise_id`] ? '2px solid #ef4444' : '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px',
                    background: errors[`exercises[${index}].exercise_id`] ? 'rgba(239, 68, 68, 0.05)' : '#ffffff',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Box className="exercise-card-header">
                      <TextField
                        id={`exercise_select_${index}`}
                        name={`exercise_select_${index}`}
                        select
                        label="תרגיל"
                        value={exercise.exercise_id}
                        onChange={(e) => updateExercise(index, 'exercise_id', e.target.value)}
                        error={!!errors[`exercises[${index}].exercise_id`]}
                        helperText={errors[`exercises[${index}].exercise_id`]}
                        required
                        variant="outlined"
                        sx={{ 
                          minWidth: 250,
                          '& .MuiOutlinedInput-notchedOutline': {
                            display: 'none'
                          },
                          '& .MuiSelect-select': {
                            textAlign: 'right',
                            direction: 'rtl',
                            padding: '12px 16px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            backgroundColor: 'rgba(248, 250, 252, 0.8)',
                            borderRadius: '8px',
                            border: '2px solid transparent',
                            transition: 'all 0.3s ease',
                            '&:focus': {
                              backgroundColor: '#ffffff',
                              borderColor: '#6366f1',
                              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(248, 250, 252, 1)',
                              borderColor: 'rgba(99, 102, 241, 0.3)'
                            }
                          },
                          '& .MuiInputLabel-root': {
                            position: 'static',
                            transform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '6px',
                            textAlign: 'right',
                            direction: 'rtl'
                          },
                          '& .MuiFormHelperText-root': {
                            textAlign: 'right',
                            direction: 'rtl',
                            marginTop: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 500
                          },
                          '& .MuiSelect-icon': {
                            right: 'auto !important',
                            left: '8px !important',
                            color: '#6b7280'
                          }
                        }}
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
                          id={`exercise_sets_${index}`}
                          name={`exercise_sets_${index}`}
                          label="סטים"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                          error={!!errors[`exercises[${index}].sets`]}
                          helperText={errors[`exercises[${index}].sets`]}
                          placeholder="3-4"
                          required
                        />

                        <TextField
                          id={`exercise_reps_${index}`}
                          name={`exercise_reps_${index}`}
                          label="חזרות"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          error={!!errors[`exercises[${index}].reps`]}
                          helperText={errors[`exercises[${index}].reps`]}
                          placeholder="8-12"
                          required
                        />

                        <TextField
                          id={`exercise_duration_${index}`}
                          name={`exercise_duration_${index}`}
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
                  sx={{
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    border: '2px solid #6366f1',
                    color: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      borderColor: '#5b5bd6',
                      color: '#5b5bd6',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(99, 102, 241, 0.2)'
                    }
                  }}
                >
                  הוסף תרגיל
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            backgroundColor: 'rgba(248, 250, 252, 0.5)',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            direction: 'rtl',
            justifyContent: 'flex-start',
            gap: 2
          }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                border: '2px solid #e2e8f0',
                color: '#64748b',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={form.exercises.length === 0}
              sx={{
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
                },
                '&:disabled': {
                  backgroundColor: '#9ca3af',
                  color: '#ffffff',
                  boxShadow: 'none'
                }
              }}
            >
              צור תוכנית
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog 
        open={editExerciseDialog} 
        onClose={() => {
          setEditExerciseDialog(false);
          setError('');
        }} 
        maxWidth="md" 
        fullWidth
        disableEnforceFocus={false}
        disableAutoFocus={false}
        disableRestoreFocus={false}
      >
        <DialogTitle>
          {editingExercise ? 'עריכת תרגיל בתוכנית' : 'הוספת תרגיל לתוכנית'}
        </DialogTitle>
        <form onSubmit={handleExerciseSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                id="edit_exercise_select"
                name="edit_exercise_select"
                select
                label="תרגיל"
                value={exerciseForm.exercise_id}
                onChange={(e) => setExerciseForm({...exerciseForm, exercise_id: e.target.value})}
                required
                fullWidth
                disabled={editingExercise}
              >
                <MenuItem value="">בחר תרגיל</MenuItem>
                {getAvailableExercises(editingProgramId).map(ex => (
                  <MenuItem key={ex.id} value={ex.id}>
                    {ex.exercise_name} ({ex.category})
                  </MenuItem>
                ))}
                {getAvailableExercises(editingProgramId).length === 0 && (
                  <MenuItem disabled>
                    כל התרגילים כבר נוספו לתוכנית זו
                  </MenuItem>
                )}
              </TextField>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  id="edit_exercise_sets"
                  name="edit_exercise_sets"
                  label="סטים"
                  value={exerciseForm.sets}
                  onChange={(e) => setExerciseForm({...exerciseForm, sets: e.target.value})}
                  placeholder="3-4"
                  required
                  sx={{ flex: 1 }}
                />

                <TextField
                  id="edit_exercise_reps"
                  name="edit_exercise_reps"
                  label="חזרות"
                  value={exerciseForm.reps}
                  onChange={(e) => setExerciseForm({...exerciseForm, reps: e.target.value})}
                  placeholder="8-12"
                  required
                  sx={{ flex: 1 }}
                />

                <TextField
                  id="edit_exercise_duration"
                  name="edit_exercise_duration"
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