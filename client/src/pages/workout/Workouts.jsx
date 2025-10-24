import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import {
  Box, Typography, Card, CardContent, CardActions, Button,
  Chip, Alert, Tab, Tabs, Grid, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, TextField, MenuItem, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
  ListItemIcon, Divider, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Fab, Badge
} from '@mui/material';
import {
  FitnessCenter, PlayArrow, Pause, Stop, Timer, 
  ExpandMore, Visibility, LibraryBooks, Assignment,
  Add, CheckCircle, RadioButtonUnchecked, PlaylistPlay,
  TrendingUp, History, SportsGymnastics
} from '@mui/icons-material';
import { trainingProgramService } from '../../services/trainingProgramService';
import { exerciseService } from '../../services/exerciseService';
import { formatToHebrewDate, formatToWorkoutDateTime, calculateDuration, formatToTime } from '../../utils/dateFormatter';
import { getDifficultyHebrew } from '../../utils/exerciseFormatter';
import './workout.css';

export default function Workouts() {
  const { authenticatedFetch } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [myPrograms, setMyPrograms] = useState([]);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = ['כוח', 'קרדיו', 'גמישות', 'יוגה', 'פילאטיס', 'פונקציונלי', 'אחר'];

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
    fetchMyPrograms();
    fetchExerciseLibrary();
    fetchWorkoutHistory();
  }, []);

  const fetchMyPrograms = async () => {
    try {
      setLoading(true);
      const response = await trainingProgramService.getMyPrograms(authenticatedFetch);
      if (response.success) {
        setMyPrograms(response.data);
      } else {
        setError('נכשל בטעינת התוכניות');
      }
    } catch (err) {
      setError('שגיאה בטעינת התוכניות: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseLibrary = async () => {
    try {
      const response = await exerciseService.getLibrary(authenticatedFetch);
      if (response.success) {
        setExerciseLibrary(response.data);
      }
    } catch (err) {
    }
  };

  const fetchWorkoutHistory = async () => {
    try {
      const response = await authenticatedFetch('/workout-history/user/workout-history');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkoutHistory(data.data);
        }
      } else {
        const errorData = await response.json();
        setWorkoutHistory([]);
      }
    } catch (err) {
      setWorkoutHistory([]);
    }
  };

  const startWorkout = (program) => {
    setCurrentWorkout({
      program: program,
      startTime: new Date(),
      completedExercises: [],
      currentExerciseIndex: 0
    });
    setTabValue(2); 
  };

  const completeExercise = (exerciseIndex) => {
    if (!currentWorkout) return;
    
    const updatedWorkout = {
      ...currentWorkout,
      completedExercises: [...currentWorkout.completedExercises, exerciseIndex]
    };
    setCurrentWorkout(updatedWorkout);
  };

  const nextExercise = () => {
    if (!currentWorkout) return;
    
    const nextIndex = currentWorkout.currentExerciseIndex + 1;
    if (nextIndex < currentWorkout.program.exercises.length) {
      setCurrentWorkout({
        ...currentWorkout,
        currentExerciseIndex: nextIndex
      });
    }
  };

  const previousExercise = () => {
    if (!currentWorkout) return;
    
    const prevIndex = currentWorkout.currentExerciseIndex - 1;
    if (prevIndex >= 0) {
      setCurrentWorkout({
        ...currentWorkout,
        currentExerciseIndex: prevIndex
      });
    }
  };

  const finishWorkout = async () => {
    if (!currentWorkout) return;
    
    if (isFinishingWorkout) return;
    setIsFinishingWorkout(true);
    
    const workoutRecord = {
      programId: currentWorkout.program.id,
      programName: currentWorkout.program.program_name,
      startTime: currentWorkout.startTime,
      endTime: new Date(),
      completedExercises: currentWorkout.completedExercises,
      totalExercises: currentWorkout.program.exercises.length
    };
    
    try {
      const response = await authenticatedFetch('/workout-history/user/workout-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: workoutRecord.programId,
          program_name: workoutRecord.programName,
          start_time: workoutRecord.startTime.toISOString(),
          end_time: workoutRecord.endTime.toISOString(),
          completed_exercises: workoutRecord.completedExercises,
          total_exercises: workoutRecord.totalExercises
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchWorkoutHistory();
        }
      } else {
        const errorData = await response.json();
      }
    } catch (error) {
    }
    
    setCurrentWorkout(null);
    setTabValue(0);
    setIsFinishingWorkout(false);
  };

  const viewProgramDetails = (program) => {
    setSelectedProgram(program);
    setOpenProgramDialog(true);
  };

  const filteredExercises = exerciseLibrary.filter(exercise => {
    const matchesSearch = exercise.exercise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || exercise.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="workout-page" dir="rtl">
        <div className="workout-loading">
          <Typography variant="h6">טוען תוכניות אימון...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-page" dir="rtl">
      <PageHeader />
      <div className="workout-content">
        <div className="workout-header">
          <div className="workout-title">
            <FitnessCenter />
            <h1>האימונים שלי</h1>
          </div>
          <p className="workout-subtitle">נהל את תוכניות האימון והתרגילים שלך</p>
        </div>

        {error && (
          <div className="workout-error" onClose={() => setError('')}>
            {error}
          </div>
        )}

        <div className="workout-tabs-container">
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            className="workout-tabs"
          >
            <Tab 
              icon={<Assignment />} 
              label="התוכניות שלי" 
              className="workout-tab"
            />
            <Tab 
              icon={<LibraryBooks />} 
              label="ספריית תרגילים" 
              className="workout-tab"
            />
            <Tab 
              icon={<PlayArrow />} 
              label="אימון פעיל" 
              disabled={!currentWorkout}
              className="workout-tab"
            />
            <Tab 
              icon={<History />} 
              label="היסטוריית אימונים" 
              className="workout-tab"
            />
          </Tabs>
        </div>

        <div className="workout-tab-panel" role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && (
            <div>
              {myPrograms.length === 0 ? (
                <div className="empty-state">
                  <Assignment className="empty-state-icon" />
                  <h6>אין תוכניות אימון</h6>
                  <p>אין לך תוכניות אימון פעילות. פנה למדריך שלך לקבלת תוכנית אימון.</p>
                </div>
              ) : (
                <div className="programs-grid">
                  {myPrograms.map((program) => (
                    <div key={program.id} className="program-card">
                      <div className="program-header">
                        <h3 className="program-name">{program.program_name}</h3>
                        <p className="program-meta">נוצר על ידי: {program.created_by_name}</p>
                        <p className="program-meta">נוצר ב: {formatToHebrewDate(program.created_at)}</p>
                      </div>
                      <div className="program-stats">
                        <span className="program-chip">
                          {(program.exercises && program.exercises.length) || 0} תרגילים
                        </span>
                      </div>
                      <div className="program-actions">
                        <button
                          className="program-btn primary"
                          onClick={() => startWorkout(program)}
                        >
                          <PlayArrow />
                          התחל אימון
                        </button>
                        <button
                          className="program-btn secondary"
                          onClick={() => viewProgramDetails(program)}
                        >
                          <Visibility />
                          צפה בתוכנית
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="workout-tab-panel" role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && (
            <div>
              <div className="library-filters">
                <div className="filters-row">
                  <TextField
                    placeholder="חיפוש תרגילים..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                  />
                  <TextField
                    select
                    label="קטגוריה"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="filter-select"
                  >
                    <MenuItem value="">כל הקטגוריות</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </TextField>
                </div>
              </div>

              <div className="exercises-grid">
                {filteredExercises.map((exercise) => (
                  <div key={exercise.id} className="exercise-card">
                    <h4 className="exercise-name">{exercise.exercise_name}</h4>
                    <div className="exercise-chips">
                      <span className="exercise-chip category">{exercise.category}</span>
                      {exercise.muscle_group && (
                        <span className="exercise-chip muscle">{exercise.muscle_group}</span>
                      )}
                      {exercise.difficulty && (
                        <span className={`exercise-chip difficulty ${exercise.difficulty}`}>
                          {getDifficultyHebrew(exercise.difficulty)}
                        </span>
                      )}
                    </div>
                    {exercise.video_url && isGifUrl(exercise.video_url) && (
                      <div className="exercise-library-media">
                        <img 
                          src={exercise.video_url} 
                          alt={exercise.exercise_name}
                          className="exercise-library-gif"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {exercise.description && (
                      <p className="exercise-description">
                        {exercise.description.substring(0, 100)}...
                      </p>
                    )}
                    {exercise.equipment && (
                      <div className="exercise-equipment">
                        <strong>ציוד:</strong> {exercise.equipment}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredExercises.length === 0 && (
                <div className="no-exercises">
                  <h6>לא נמצאו תרגילים לפי החיפוש</h6>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="workout-tab-panel" role="tabpanel" hidden={tabValue !== 2}>
          {tabValue === 2 && (
            <div>
              {currentWorkout && (
                <div>
                  <div className="active-workout-header">
                    <div className="workout-title-bar">
                      <h2 className="workout-name">{currentWorkout.program.program_name}</h2>
                      <div className="workout-actions">
                        <button
                          className="workout-btn success"
                          onClick={finishWorkout}
                          disabled={isFinishingWorkout}
                        >
                          <CheckCircle />
                          {isFinishingWorkout ? 'שומר...' : 'סיים אימון'}
                        </button>
                        <button
                          className="workout-btn outlined"
                          onClick={() => {
                            setCurrentWorkout(null);
                            setTabValue(0);
                          }}
                        >
                          בטל אימון
                        </button>
                      </div>
                    </div>
                    <p className="workout-start-time">
                      התחיל ב: {formatToHebrewDate(currentWorkout.startTime)}
                    </p>
                  </div>

                  <div className="workout-navigation">
                    <button
                      className="nav-btn prev-btn"
                      onClick={previousExercise}
                      disabled={currentWorkout.currentExerciseIndex === 0}
                    >
                      <span>←</span>
                      תרגיל קודם
                    </button>
                    
                    <div className="workout-progress">
                      <span className="progress-text">
                        {currentWorkout.currentExerciseIndex + 1} / {currentWorkout.program.exercises.length}
                      </span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${((currentWorkout.currentExerciseIndex + 1) / currentWorkout.program.exercises.length) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <button
                      className="nav-btn next-btn"
                      onClick={nextExercise}
                      disabled={currentWorkout.currentExerciseIndex >= currentWorkout.program.exercises.length - 1}
                    >
                      תרגיל הבא
                      <span>→</span>
                    </button>
                  </div>

                  <div className="exercises-list">
                    {currentWorkout.program.exercises && currentWorkout.program.exercises.map((exercise, index) => (
                      <div 
                        key={index} 
                        className={`exercise-item ${
                          currentWorkout.completedExercises.includes(index) ? 'completed' : ''
                        } ${currentWorkout.currentExerciseIndex === index ? 'current' : ''}`}
                        style={{
                          display: currentWorkout.currentExerciseIndex === index ? 'block' : 'none'
                        }}
                      >
                        <div className="exercise-item-content">
                          <div className="exercise-header">
                            <h4 className="exercise-title">{exercise.exercise_name}</h4>
                            <div className="exercise-number">
                              {index + 1} / {currentWorkout.program.exercises.length}
                            </div>
                          </div>
                          
                          {exercise.video_url && isGifUrl(exercise.video_url) && (
                            <div className="exercise-gif-container">
                              <img 
                                src={exercise.video_url} 
                                alt={exercise.exercise_name}
                                className="exercise-gif"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="exercise-details">
                            {exercise.description && (
                              <p className="exercise-description-text">{exercise.description}</p>
                            )}
                            <div className="exercise-metrics">
                              <span className="exercise-metric">
                                <strong>{exercise.sets}</strong> סטים
                              </span>
                              <span className="exercise-metric">
                                <strong>{exercise.reps}</strong> חזרות
                              </span>
                              {exercise.duration > 0 && (
                                <span className="exercise-metric">
                                  <strong>{exercise.duration}</strong> דקות
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="exercise-actions">
                            <button
                              className="exercise-checkbox"
                              onClick={() => completeExercise(index)}
                            >
                              {currentWorkout.completedExercises.includes(index) ? 
                                <CheckCircle style={{ color: '#10b981' }} /> : 
                                <RadioButtonUnchecked style={{ color: '#64748b' }} />
                              }
                              <span>
                                {currentWorkout.completedExercises.includes(index) ? 'הושלם' : 'סמן כהושלם'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="workout-tab-panel" role="tabpanel" hidden={tabValue !== 3}>
          {tabValue === 3 && (
            <div>
              {workoutHistory.length === 0 ? (
                <div className="empty-state">
                  <History className="empty-state-icon" />
                  <h6>אין היסטוריית אימונים</h6>
                  <p>עדיין לא ביצעת אימונים. התחל אימון כדי לראות את ההיסטוריה כאן.</p>
                </div>
              ) : (
                <div className="history-list">
                  {workoutHistory.map((workout, index) => {
                    const programName = workout.program_name || workout.programName;
                    const startTime = workout.start_time || workout.startTime;
                    const endTime = workout.end_time || workout.endTime;
                    const completedExercises = workout.completed_exercises || workout.completedExercises;
                    const totalExercises = workout.total_exercises || workout.totalExercises;
                    const duration = workout.duration_minutes || 
                      (workout.endTime && workout.startTime ? 
                        Math.round((new Date(workout.endTime) - new Date(workout.startTime)) / (1000 * 60)) : 
                        null);
                    
                    const completionRate = totalExercises > 0 ? 
                      Math.round((completedExercises.length / totalExercises) * 100) : 0;
                    
                    return (
                      <div key={workout.id || index} className="history-item">
                        <h4 className="history-program-name">{programName}</h4>
                        <div className="history-details-grid">
                          <div className="history-detail-item">
                            <span className="detail-label">תאריך:</span>
                            <span className="detail-value">{formatToHebrewDate(startTime)}</span>
                          </div>
                          <div className="history-detail-item">
                            <span className="detail-label">התחיל שעה:</span>
                            <span className="detail-value">{formatToTime(startTime)}</span>
                          </div>
                          <div className="history-detail-item">
                            <span className="detail-label">הסתיים שעה:</span>
                            <span className="detail-value">{formatToTime(endTime)}</span>
                          </div>
                          {duration && (
                            <div className="history-detail-item">
                              <span className="detail-label">משך:</span>
                              <span className="detail-value">{duration} דקות</span>
                            </div>
                          )}
                        </div>
                        <div className="history-stats">
                          <span className={`history-completion-chip ${
                            completedExercises.length === totalExercises ? '' : 'incomplete'
                          }`}>
                            {completedExercises.length}/{totalExercises} תרגילים הושלמו ({completionRate}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <Dialog 
          open={openProgramDialog} 
          onClose={() => setOpenProgramDialog(false)} 
          maxWidth="md" 
          fullWidth
          className="program-dialog"
        >
          <DialogTitle className="program-dialog-title">
            {selectedProgram && selectedProgram.program_name}
          </DialogTitle>
          <DialogContent className="program-dialog-content">
            {selectedProgram && (
              <div>
                <div className="program-dialog-meta">
                  נוצר על ידי: {selectedProgram.created_by_name} | נוצר ב: {formatToHebrewDate(selectedProgram.created_at)}
                </div>
                
                <div className="program-exercises-table">
                  <TableContainer component={Paper}>
                    <Table className="program-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>תרגיל</TableCell>
                          <TableCell>קטגוריה</TableCell>
                          <TableCell>קבוצת שרירים</TableCell>
                          <TableCell>סטים</TableCell>
                          <TableCell>חזרות</TableCell>
                          <TableCell>משך (דקות)</TableCell>
                          <TableCell>רמת קושי</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedProgram.exercises && selectedProgram.exercises.map((exercise, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="exercise-name-cell">
                                {exercise.exercise_name}
                              </div>
                              {exercise.description && (
                                <div className="exercise-description-cell">
                                  {exercise.description.substring(0, 60)}...
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="exercise-chip category">{exercise.category}</span>
                            </TableCell>
                            <TableCell>{exercise.muscle_group || '-'}</TableCell>
                            <TableCell>{exercise.sets}</TableCell>
                            <TableCell>{exercise.reps}</TableCell>
                            <TableCell>{exercise.duration || 0}</TableCell>
                            <TableCell>
                              {exercise.difficulty && (
                                <span className={`exercise-chip difficulty ${exercise.difficulty}`}>
                                  {getDifficultyHebrew(exercise.difficulty)}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions className="program-dialog-actions">
            <button 
              className="dialog-btn secondary"
              onClick={() => setOpenProgramDialog(false)}
            >
              סגור
            </button>
            {selectedProgram && (
              <button 
                className="dialog-btn primary"
                onClick={() => {
                  setOpenProgramDialog(false);
                  startWorkout(selectedProgram);
                }}
              >
                <PlayArrow />
                התחל אימון
              </button>
            )}
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}