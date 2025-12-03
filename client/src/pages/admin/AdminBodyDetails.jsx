import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatToBodyDetailsDate } from '../../utils/dateFormatter';
import { formatUsersData } from '../../utils/userFormatter';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import './AdminBodyDetails.css';

const AdminBodyDetails = () => {
  const { authenticatedFetch, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [bodyDetails, setBodyDetails] = useState([]);
  const [lastHeight, setLastHeight] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [formData, setFormData] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    circumference: '',
    recorded_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!hasPermission('view_users')) {
      setError('אין לך הרשאות לצפות במדדי גוף');
      return;
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserInfo();
      fetchBodyDetails();
      fetchLastHeight();
    } else {
      setBodyDetails([]);
      setSelectedUser(null);
      setLastHeight(null);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const response = await authenticatedFetch('/U/list?p=0');
      const data = await response.json();
      if (data.success) {
        const formatted = formatUsersData(data.data);
        setUsers(formatted);
        setFilteredUsers(formatted);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('שגיאה בטעינת רשימת המשתמשים');
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(query) ||
        user.phone?.includes(query) ||
        user.id?.toString().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUserInfo = async () => {
    try {
      const response = await authenticatedFetch(`/U/${selectedUserId}?expand=1`);
      const data = await response.json();
      if (data.success && data.data?.user) {
        setSelectedUser(data.data.user);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchBodyDetails = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/body-details/user/${selectedUserId}`);
      const data = await response.json();
      if (data.success) {
        setBodyDetails(data.data);
      } else {
        setError(data.message || 'שגיאה בטעינת מדדי הגוף');
      }
    } catch (err) {
      console.error('Error fetching body details:', err);
      setError('שגיאת רשת. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLastHeight = async () => {
    try {
      const response = await authenticatedFetch(`/body-details/user/${selectedUserId}`);
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const latest = data.data[0];
        if (latest.height) {
          setLastHeight(latest.height);
        }
      }
    } catch (err) {
      console.error('Error fetching last height:', err);
    }
  };

  const calculateBMI = (weight, height) => {
    const heightToUse = height || lastHeight;
    if (!weight || !heightToUse) return null;
    const heightInMeters = heightToUse / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    const { weight, body_fat, muscle_mass, circumference } = formData;
    
    if (!weight && !body_fat && !muscle_mass && !circumference) {
      setError('אנא מלא לפחות שדה מדידה אחד');
      return false;
    }

    const numericFields = { weight, body_fat, muscle_mass, circumference };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value && (isNaN(value) || parseFloat(value) <= 0)) {
        setError(`${field.replace('_', ' ')} חייב להיות מספר חיובי`);
        return false;
      }
    }

    if (weight && (parseFloat(weight) < 30 || parseFloat(weight) > 300)) {
      setError('המשקל חייב להיות בין 30-300 ק״ג');
      return false;
    }

    if (body_fat && (parseFloat(body_fat) < 3 || parseFloat(body_fat) > 60)) {
      setError('אחוזי השומן חייבים להיות בין 3-60%');
      return false;
    }

    if (muscle_mass && (parseFloat(muscle_mass) < 10 || parseFloat(muscle_mass) > 100)) {
      setError('מסת השריר חייבת להיות בין 10-100 ק״ג');
      return false;
    }

    if (circumference && (parseFloat(circumference) < 50 || parseFloat(circumference) > 200)) {
      setError('היקף המותניים חייב להיות בין 50-200 ס״מ');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = {
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: editingRecord?.height || lastHeight || null,
        body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
        muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null,
        circumference: formData.circumference ? parseFloat(formData.circumference) : null,
        recorded_at: formData.recorded_at
      };

      let response;
      if (editingRecord) {
        response = await authenticatedFetch(`/body-details/admin/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      } else {
        response = await authenticatedFetch(`/body-details/user/${selectedUserId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(editingRecord ? 'מדדי הגוף עודכנו בהצלחה!' : 'מדדי הגוף נוספו בהצלחה!');
        setFormData({
          weight: '',
          body_fat: '',
          muscle_mass: '',
          circumference: '',
          recorded_at: new Date().toISOString().split('T')[0]
        });
        setEditingRecord(null);
        setShowAddForm(false);
        await fetchBodyDetails();
        await fetchLastHeight();
      } else {
        setError(result.message || 'שגיאה בשמירת מדדי הגוף');
      }
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב.');
      console.error('Error saving body details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      weight: record.weight || '',
      body_fat: record.body_fat || '',
      muscle_mass: record.muscle_mass || '',
      circumference: record.circumference || '',
      recorded_at: record.recorded_at
    });
    if (record.height) {
      setLastHeight(record.height);
    }
    setEditingRecord(record);
    setShowAddForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch(`/body-details/admin/${recordId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('הרשומה נמחקה בהצלחה!');
        await fetchBodyDetails();
        await fetchLastHeight();
      } else {
        setError(result.message || 'שגיאה במחיקת הרשומה');
      }
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב.');
      console.error('Error deleting record:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setEditingRecord(null);
    setShowAddForm(false);
    setFormData({
      weight: '',
      body_fat: '',
      muscle_mass: '',
      circumference: '',
      recorded_at: new Date().toISOString().split('T')[0]
    });
    setError('');
    setSuccess('');
  };

  if (!hasPermission('view_users')) {
    return (
      <div className="admin-body-details-page">
        <div className="error-message">אין לך הרשאות לצפות בדף זה</div>
      </div>
    );
  }

  return (
    <div className="admin-body-details-page">
      <div className="admin-body-details-header">
        <h1 className="userTitle">ניהול מדדי גוף</h1>
      </div>

      <div className="admin-body-details-content">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="user-selection-section">
          <label htmlFor="user-search" className="user-select-label">חפש ובחר לקוח (שם, טלפון או מזהה):</label>
          <input
            id="user-search"
            type="text"
            className="user-search-input"
            placeholder="הקלד שם, טלפון או מזהה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {searchQuery && (
            <div className="users-list-container">
              {filteredUsers.length > 0 ? (
                <>
                  <div className="search-results-info">
                    נמצאו {filteredUsers.length} משתמשים
                  </div>
                  <div className="users-list">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`user-item ${selectedUserId === user.id.toString() ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedUserId(user.id.toString());
                          setSearchQuery(''); // איפוס החיפוש אחרי בחירה
                        }}
                      >
                        <div className="user-item-info">
                          <span className="user-item-name">{user.username}</span>
                          <span className="user-item-phone">{user.phone}</span>
                          <span className="user-item-id">מזהה: {user.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="search-no-results">
                  לא נמצאו משתמשים התואמים לחיפוש
                </div>
              )}
            </div>
          )}

          {!searchQuery && selectedUserId && selectedUser && (
            <div className="selected-user-display">
              <div className="selected-user-badge">
                <span className="selected-user-name">{selectedUser.username}</span>
                <span className="selected-user-phone">{selectedUser.phone}</span>
                <button
                  className="clear-selection-btn"
                  onClick={() => {
                    setSelectedUserId('');
                    setSelectedUser(null);
                    setBodyDetails([]);
                    setLastHeight(null);
                    setShowAddForm(false);
                    setEditingRecord(null);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedUserId && selectedUser && (
          <div className="selected-user-info">
            <h3 className="userShowTitle">לקוח נבחר: {selectedUser.username} ({selectedUser.phone})</h3>
            {hasPermission('edit_users') && (
              <button
                className="add-button"
                onClick={() => {
                  setShowAddForm(true);
                  setEditingRecord(null);
                  setFormData({
                    weight: '',
                    body_fat: '',
                    muscle_mass: '',
                    circumference: '',
                    recorded_at: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                <AddIcon /> הוסף מדידה חדשה
              </button>
            )}
          </div>
        )}

        {showAddForm && selectedUserId && (
          <div className="add-form-section">
            <h3 className="userShowTitle">{editingRecord ? 'עריכת מדידה' : 'הוספת מדידה חדשה'}</h3>
            <form onSubmit={handleSubmit} className="body-details-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="body_weight">משקל (ק״ג)</label>
                  <input
                    id="body_weight"
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="לדוגמה: 70.5"
                  />
                </div>
                {lastHeight && (
                  <div className="form-group">
                    <label>גובה (ס״מ)</label>
                    <div className="height-info">
                      <span className="height-value">{lastHeight} ס״מ</span>
                      <span className="height-note">(נטען אוטומטית מהמדידה האחרונה)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="body_fat_percentage">אחוזי שומן (%)</label>
                  <input
                    id="body_fat_percentage"
                    type="number"
                    name="body_fat"
                    value={formData.body_fat}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="לדוגמה: 15.5"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="muscle_mass_kg">מסת שריר (ק״ג)</label>
                  <input
                    id="muscle_mass_kg"
                    type="number"
                    name="muscle_mass"
                    value={formData.muscle_mass}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="לדוגמה: 45.2"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="waist_circumference">היקף מותניים (ס״מ)</label>
                  <input
                    id="waist_circumference"
                    type="number"
                    name="circumference"
                    value={formData.circumference}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="לדוגמה: 85"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="measurement_date">תאריך מדידה</label>
                  <input
                    id="measurement_date"
                    type="date"
                    name="recorded_at"
                    value={formData.recorded_at}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {formData.weight && lastHeight && (
                <div className="bmi-preview">
                  <span>תצוגה מקדימה BMI: {calculateBMI(formData.weight, lastHeight)}</span>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={cancelForm} className="btn-secondary">
                  ביטול
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'שומר...' : (editingRecord ? 'עדכון' : 'הוספה')}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedUserId && (
          <div className="history-section">
            <h3 className="userShowTitle">היסטוריית מדידות ({bodyDetails.length} רשומות)</h3>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <div>טוען...</div>
              </div>
            ) : bodyDetails.length > 0 ? (
              <div className="history-list">
                {bodyDetails.map((record) => (
                  <div key={record.id} className="history-item">
                    <div className="history-date">{formatToBodyDetailsDate(record.recorded_at)}</div>
                    <div className="history-metrics">
                      {record.weight && <span>משקל: {record.weight} ק״ג</span>}
                      {record.height && <span>גובה: {record.height} ס״מ</span>}
                      {record.body_fat && <span>אחוזי שומן: {record.body_fat}%</span>}
                      {record.muscle_mass && <span>שריר: {record.muscle_mass} ק״ג</span>}
                      {record.circumference && <span>מותניים: {record.circumference} ס״מ</span>}
                      {record.weight && record.height && (
                        <span>BMI: {calculateBMI(record.weight, record.height)}</span>
                      )}
                    </div>
                    {hasPermission('edit_users') && (
                      <div className="history-actions">
                        <button onClick={() => handleEdit(record)} className="btn-edit">
                          <EditIcon /> עריכה
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)} 
                          className="btn-delete"
                          disabled={loading}
                        >
                          <DeleteIcon /> מחיקה
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>לא נרשמו מדדים עדיין.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBodyDetails;

