import  { useState } from 'react';
import './ProgressOverview.css';

const ProgressOverview = ({ chartData }) => {
  const [viewMode, setViewMode] = useState('daily'); 
  const [selectedMetric, setSelectedMetric] = useState('weight');

  const groupDataByPeriod = (data, period) => {
    if (!data || data.length === 0) return [];

    const grouped = {};
    
    data.forEach(item => {
      let date;
      if (typeof item.date === 'string') {
        date = new Date(item.date + 'T00:00:00'); 
      } else {
        date = new Date(item.date);
      }
      if (isNaN(date.getTime())) {
        console.warn('תאריך לא חוקי:', item.date);
        return;
      }
      
      let key;
      let sortKey;
      
      switch (period) {
        case 'daily': {
          key = date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
          sortKey = date.getTime();
          break;
        }
        case 'weekly': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); 
          key = `שבוע של ${weekStart.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}`;
          sortKey = weekStart.getTime();
          break;
        }
        case 'monthly':
        default: {
          key = date.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });
          sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
          break;
        }
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          items: [],
          sortKey: sortKey
        };
      }
      grouped[key].items.push(item);
    });

    const result = Object.entries(grouped)
      .map(([period, group]) => {
        const items = group.items;
        const validWeights = items.filter(item => item.weight && item.weight > 0);
        const validBodyFats = items.filter(item => item.bodyFat && item.bodyFat > 0);
        const validMuscleMass = items.filter(item => item.muscleMass && item.muscleMass > 0);
        const validBMIs = items.filter(item => item.bmi && item.bmi > 0);
        
        return {
          period,
          weight: validWeights.length > 0 
            ? validWeights.reduce((sum, item) => sum + item.weight, 0) / validWeights.length 
            : 0,
          bodyFat: validBodyFats.length > 0 
            ? validBodyFats.reduce((sum, item) => sum + item.bodyFat, 0) / validBodyFats.length 
            : 0,
          muscleMass: validMuscleMass.length > 0 
            ? validMuscleMass.reduce((sum, item) => sum + item.muscleMass, 0) / validMuscleMass.length 
            : 0,
          bmi: validBMIs.length > 0 
            ? validBMIs.reduce((sum, item) => sum + item.bmi, 0) / validBMIs.length 
            : 0,
          count: items.length,
          sortKey: group.sortKey
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-12);
      
    return result;
  };

  const groupedData = groupDataByPeriod(chartData, viewMode);
  
  const getMetricData = (metric) => {
    const validValues = groupedData
      .map(item => item[metric])
      .filter(val => val && val > 0);
    
    if (validValues.length === 0) {
      return groupedData.map(item => ({
        ...item,
        value: item[metric] || 0,
        percentage: 0,
        change: 0
      }));
    }
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const range = max - min || 1;
    
    return groupedData.map((item, index) => {
      const value = item[metric] || 0;
      const percentage = validValues.length > 1 && value > 0 
        ? ((value - min) / range) * 100 
        : value > 0 ? 50 : 0;
      
      let change = 0;
      if (index > 0 && value > 0 && groupedData[index - 1][metric] > 0) {
        change = value - groupedData[index - 1][metric];
      }
      
      return {
        ...item,
        value: value,
        percentage: Math.max(percentage, value > 0 ? 5 : 0), 
        change: change
      };
    });
  };

  const metricData = getMetricData(selectedMetric);
  
  const getMetricInfo = (metric) => {
    const configs = {
      weight:     { label: 'משקל',        unit: 'ק״ג', color: '#3b82f6', icon: '⚖️' },
      bodyFat:    { label: 'אחוזי שומן',  unit: '%',   color: '#8b5cf6', icon: '📊' },
      muscleMass: { label: 'מסת שריר',    unit: 'ק״ג', color: '#10b981', icon: '💪' },
      bmi:        { label: 'BMI',         unit: '',    color: '#f59e0b', icon: '📈' }
    };
    return configs[metric] || configs.weight;
  };

  const metricInfo = getMetricInfo(selectedMetric);

  const calculateSummaryStats = () => {
    const validData = metricData.filter(item => item.value > 0);
    
    if (validData.length === 0) {
      return {
        totalChange: { value: 0, hasData: false },
        average: { value: 0, hasData: false },
        bestValue: { value: 0, hasData: false },
        consistency: { value: `0/${metricData.length}`, hasData: false }
      };
    }
    
    const firstValue = validData[0].value;
    const lastValue = validData[validData.length - 1].value;
    const totalChange = lastValue - firstValue;
    
    const average = validData.reduce((sum, item) => sum + item.value, 0) / validData.length;
    const bestValue = Math.max(...validData.map(item => item.value));
    
    return {
      totalChange: { value: totalChange, hasData: true },
      average: { value: average, hasData: true },
      bestValue: { value: bestValue, hasData: true },
      consistency: { 
        value: `${validData.length}/${metricData.length}`, 
        hasData: true 
      }
    };
  };

  const summaryStats = calculateSummaryStats();

  if (!chartData || chartData.length === 0) {
    return (
      <div className="no-data-container" dir="rtl">
        <div className="no-data-icon">📊</div>
        <h4>עדיין אין נתוני התקדמות</h4>
        <p>התחילו לעקוב אחרי המדדים כדי לראות מגמות לאורך זמן!</p>
      </div>
    );
  }

  return (
    <div className="progress-overview-container" dir="rtl">
      <div className="progress-header">
        <div className="progress-title-section">
          <div className="progress-icon">{metricInfo.icon}</div>
          <div className="progress-title-content">
            <h4>מעקב התקדמות</h4>
            <p>עקבו אחרי הדרך שלכם בכושר</p>
          </div>
        </div>
        
        <div className="view-mode-toggle" role="tablist" aria-label="מצב תצוגה">
          {['daily', 'weekly', 'monthly'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`view-mode-button ${viewMode === mode ? 'active' : ''}`}
              role="tab"
              aria-selected={viewMode === mode}
            >
              {mode === 'daily' ? 'יומי' : mode === 'weekly' ? 'שבועי' : 'חודשי'}
            </button>
          ))}
        </div>
      </div>

      <div className="metric-selector">
        {['weight', 'bodyFat', 'muscleMass', 'bmi'].map((metric) => {
          const info = getMetricInfo(metric);
          return (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`metric-button ${metric} ${selectedMetric === metric ? 'active' : ''}`}
            >
              <span>{info.icon}</span>
              {info.label}
            </button>
          );
        })}
      </div>

      <div className="progress-items">
        {metricData.map((item, index) => (
          <div key={item.period} className="progress-item">
            <div className="progress-item-header">
              <span className="period-label">{item.period}</span>
              <div className="progress-value-container">
                <span className="progress-main-value">
                  {item.value > 0 ? item.value.toFixed(1) : '--'}
                </span>
                <span className="progress-unit">{metricInfo.unit}</span>
                {index > 0 && item.change !== 0 && (
                  <span className={`progress-change ${item.change > 0 ? 'positive' : 'negative'}`}>
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.max(item.percentage, item.value > 0 ? 5 : 0)}%`,
                  backgroundColor: metricInfo.color
                }}
              >
                {item.count > 1 && (
                  <span className="progress-bar-text">
                    {item.count} רשומות
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {metricData.length >= 2 && (
        <div className="progress-summary">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">שינוי מצטבר</span>
              <span className={`summary-value ${
                summaryStats.totalChange.hasData 
                  ? (summaryStats.totalChange.value >= 0 ? 'positive' : 'negative')
                  : ''
              }`}>
                {summaryStats.totalChange.hasData ? (
                  <>
                    {summaryStats.totalChange.value > 0 ? '+' : ''}
                    {summaryStats.totalChange.value.toFixed(1)}
                    <span className="summary-unit">{metricInfo.unit}</span>
                  </>
                ) : (
                  'NaN'
                )}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">ממוצע</span>
              <span className="summary-value">
                {summaryStats.average.hasData ? (
                  <>
                    {summaryStats.average.value.toFixed(1)}
                    <span className="summary-unit">{metricInfo.unit}</span>
                  </>
                ) : (
                  'NaN'
                )}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">ערך שיא</span>
              <span className="summary-value blue">
                {summaryStats.bestValue.hasData ? (
                  <>
                    {summaryStats.bestValue.value.toFixed(1)}
                    <span className="summary-unit">{metricInfo.unit}</span>
                  </>
                ) : (
                  'NaN'
                )}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">עקביות</span>
              <span className="summary-value purple">
                {summaryStats.consistency.value}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="progress-tips">
        <div className="tips-content">
          <div className="tips-icon">💡</div>
          <div className="tips-text">
            <h5>טיפ למעקב</h5>
            <p>
              {viewMode === 'daily' && "תצוגה יומית מציגה את דפוסי ההתקדמות המדויקים ביותר."}
              {viewMode === 'weekly' && "תצוגה שבועית מדגישה מגמות ומצמצמת תנודות יומיות."}
              {viewMode === 'monthly' && "תצוגה חודשית נותנת תמונת מצב רחבה לטווח ארוך."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;
