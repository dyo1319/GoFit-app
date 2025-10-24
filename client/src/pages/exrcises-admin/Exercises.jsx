import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Box, Typography, Alert,
  Chip, Card, CardContent
} from '@mui/material';
import { 
  Add, Edit, Delete, FitnessCenter,
  Search, FilterList 
} from '@mui/icons-material';
import { makeFieldChange } from '../../utils/formHelpers';
import { initialExerciseForm } from '../../utils/formDefaults';
import { validateExerciseForm } from '../../utils/validators';
import { formatExercisesData, getDifficultyHebrew } from '../../utils/exerciseFormatter';
import './Exercises.css';

export default function Exercises() {
  const { authenticatedFetch, hasPermission } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState(initialExerciseForm);
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  const categories = ['כוח', 'קרדיו', 'גמישות', 'יוגה', 'פילאטיס', 'פונקציונלי', 'אחר'];
  const muscleGroups = ['חזה', 'גב', 'רגליים', 'ידיים', 'כתפיים', 'בטן', 'גוף מלא'];
  const difficulties = [
    { value: 'beginner', label: 'מתחיל' },
    { value: 'intermediate', label: 'בינוני' },
    { value: 'advanced', label: 'מתקדם' }
  ];

  const handleFieldChange = makeFieldChange(setForm, setErrors);

  const isGifUrl = (url) => {
    if (!url) return false;
    const gifExtensions = ['.gif', '.GIF'];
    const gifDomains = ['giphy.com', 'tenor.com', 'imgur.com'];
    
    if (gifExtensions.some(ext => url.includes(ext))) {
      return true;
    }
    
    if (gifDomains.some(domain => url.includes(domain))) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/exercises');
      const data = await response.json();
      
      if (data.success) {
        setExercises(formatExercisesData(data.data));
      } else {
        setError('נכשל בטעינת התרגילים');
      }
    } catch (err) {
      setError('שגיאה בטעינת התרגילים: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateExerciseForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const url = editingExercise ? `/exercises/${editingExercise.id}` : '/exercises';
      const method = editingExercise ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method: method,
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (data.success) {
        setOpenDialog(false);
        resetForm();
        fetchExercises();
        setSuccess(editingExercise ? 'התרגיל עודכן בהצלחה' : 'התרגיל נוצר בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'הפעולה נכשלה');
      }
    } catch (err) {
      setError('שגיאה בשמירת התרגיל: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תרגיל זה?')) return;

    try {
      const response = await authenticatedFetch(`/exercises/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchExercises();
        setSuccess('התרגיל נמחק בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'המחיקה נכשלה');
      }
    } catch (err) {
      setError('שגיאה במחיקת התרגיל: ' + err.message);
    }
  };

  const resetForm = () => {
    setForm(initialExerciseForm);
    setErrors({});
    setEditingExercise(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const openEditDialog = (exercise) => {
    setEditingExercise(exercise);
    setForm({
      exercise_name: exercise.exercise_name,
      category: exercise.category,
      description: exercise.description || '',
      muscle_group: exercise.muscle_group || '',
      difficulty: exercise.difficulty || '',
      equipment: exercise.equipment || '',
      video_url: exercise.video_url || ''
    });
    setOpenDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  useEffect(() => {
    if (openDialog) {
      const timer = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [openDialog]);

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.exercise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || exercise.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="loading">טוען תרגילים...</div>;

  return (
    <div className="exercises-admin">
      <div className="page-container">
      <div className="page-header">
        <Typography variant="h4" component="h1" gutterBottom>
          <FitnessCenter sx={{ mr: 1 }} />
          ספריית תרגילים
        </Typography>
        <Typography variant="body1" color="textSecondary">
          ניהול ספריית התרגילים של המכון
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
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="חיפוש תרגילים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
            
            <TextField
              select
              label="קטגוריה"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">כל הקטגוריות</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ flexGrow: 1 }} />

            {hasPermission('manage_plans') && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openCreateDialog}
              >
                תרגיל חדש
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>שם התרגיל</TableCell>
              <TableCell>קטגוריה</TableCell>
              <TableCell>קבוצת שרירים</TableCell>
              <TableCell>רמת קושי</TableCell>
              <TableCell>ציוד</TableCell>
              <TableCell>נוצר על ידי</TableCell>
              <TableCell>נוצר ב</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                    {exercise.exercise_name}
                  </Typography>
                  {exercise.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                      {exercise.description.substring(0, 50)}...
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={exercise.category} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{exercise.muscle_group || '-'}</TableCell>
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
                <TableCell>{exercise.equipment || '-'}</TableCell>
                <TableCell>{exercise.created_by_name || '-'}</TableCell>
                <TableCell>{exercise.created_at || '-'}</TableCell>
                <TableCell>
                  {hasPermission('manage_plans') && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => openEditDialog(exercise)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(exercise.id)}
                        color="error"
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

      {filteredExercises.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="textSecondary">
            {exercises.length === 0 ? 'אין תרגילים במערכת' : 'לא נמצאו תרגילים לפי החיפוש'}
          </Typography>
        </Box>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
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
            maxWidth: '600px',
            width: '90%',
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
            <FitnessCenter sx={{ fontSize: '1.5rem' }} />
            {editingExercise ? 'עריכת תרגיל' : 'תרגיל חדש'}
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ 
            padding: '24px',
            backgroundColor: '#ffffff',
            direction: 'rtl'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                ref={firstInputRef}
                label="שם התרגיל"
                value={form.exercise_name}
                onChange={(e) => handleFieldChange('exercise_name', e.target.value)}
                error={!!errors.exercise_name}
                helperText={errors.exercise_name}
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
              
              <TextField
                select
                label="קטגוריה"
                value={form.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                error={!!errors.category}
                helperText={errors.category}
                required
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    display: 'none'
                  },
                  '& .MuiSelect-select': {
                    textAlign: 'right',
                    direction: 'rtl',
                    padding: '16px 20px',
                    paddingLeft: '40px !important',
                    paddingRight: '20px !important',
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
                  },
                  '& .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important',
                    color: '#6b7280'
                  },
                  '& .MuiNativeSelect-root .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important'
                  },
                  '& .MuiOutlinedInput-root .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important'
                  },
                  '& .MuiSelect-nativeInput': {
                    paddingLeft: '40px !important',
                    paddingRight: '20px !important'
                  }
                }}
              >
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="תיאור"
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
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
                    resize: 'vertical',
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

              <TextField
                select
                label="קבוצת שרירים"
                value={form.muscle_group}
                onChange={(e) => handleFieldChange('muscle_group', e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    display: 'none'
                  },
                  '& .MuiSelect-select': {
                    textAlign: 'right',
                    direction: 'rtl',
                    padding: '16px 20px',
                    paddingLeft: '40px !important',
                    paddingRight: '20px !important',
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
                  },
                  '& .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important',
                    color: '#6b7280'
                  },
                  '& .MuiNativeSelect-root .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important'
                  },
                  '& .MuiOutlinedInput-root .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important'
                  },
                  '& .MuiSelect-nativeInput': {
                    paddingLeft: '40px !important',
                    paddingRight: '20px !important'
                  }
                }}
              >
                <MenuItem value="">בחר קבוצת שרירים</MenuItem>
                {muscleGroups.map(group => (
                  <MenuItem key={group} value={group}>{group}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="רמת קושי"
                value={form.difficulty}
                onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    display: 'none'
                  },
                  '& .MuiSelect-select': {
                    textAlign: 'right',
                    direction: 'rtl',
                    padding: '16px 20px',
                    paddingLeft: '40px !important',
                    paddingRight: '20px !important',
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
                  },
                  '& .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important',
                    color: '#6b7280'
                  },
                  '& .MuiNativeSelect-root .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important'
                  },
                  '& .MuiOutlinedInput-root .MuiSelect-icon': {
                    right: 'auto !important',
                    left: '12px !important'
                  },
                  '& .MuiSelect-nativeInput': {
                    paddingLeft: '40px !important',
                    paddingRight: '20px !important'
                  }
                }}
              >
                <MenuItem value="">בחר רמת קושי</MenuItem>
                {difficulties.map(diff => (
                  <MenuItem key={diff.value} value={diff.value}>{diff.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="ציוד נדרש"
                value={form.equipment}
                onChange={(e) => handleFieldChange('equipment', e.target.value)}
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

              <TextField
                label="קישור ל-GIF (אופציונלי)"
                value={form.video_url}
                onChange={(e) => handleFieldChange('video_url', e.target.value)}
                error={!!errors.video_url}
                helperText={errors.video_url}
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
              onClick={handleCloseDialog}
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
                }
              }}
            >
              {editingExercise ? 'עדכן' : 'צור'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      </div>
    </div>
  );
}
