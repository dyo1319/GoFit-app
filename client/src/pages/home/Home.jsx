import * as React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import {
  Paper, Box, Typography, CircularProgress, Tooltip,
  IconButton, TextField, Grid, Alert, Tab, Tabs
} from "@mui/material";
import {
  Group, CheckCircle, WarningAmber, People, Refresh, Notifications,
  Paid, Pending, Cancel, Replay, PlayArrow, Pause, Stop, Schedule,
  BarChart, Analytics
} from "@mui/icons-material";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import "./home.css";

const API_BASE = import.meta.env.VITE_API_BASE;

const PAYMENT_COLORS = {
  paid: "#2e7d32",      
  pending: "#ed6c02",   
  failed: "#d32f2f",    
  refunded: "#0288d1",  
};

const SUBSCRIPTION_COLORS = {
  active: "#2e7d32",    
  expired: "#757575",   
  canceled: "#d32f2f",  
  paused: "#ed6c02",   
};

const PAYMENT_LABELS = {
  paid: "שולם",
  pending: "ממתין",
  failed: "נכשל",
  refunded: "הוחזר",
};

const SUBSCRIPTION_LABELS = {
  active: "פעיל",
  expired: "פג תוקף",
  canceled: "בוטל",
  paused: "מושהה",
};

function StatCard({ title, value, icon, color = "#3f51b5", subtitle, action }) {
  return (
    <Paper className="stat-card">
      <Box className="stat-card-content">
        <Box className="stat-card-icon" sx={{ bgcolor: color }}>
          {icon}
        </Box>
        <Box className="stat-card-text">
          <Typography className="stat-card-title" variant="body2">{title}</Typography>
          <Typography className="stat-card-value">{value ?? "—"}</Typography>
          {subtitle && <Typography className="stat-card-subtitle" variant="caption">{subtitle}</Typography>}
        </Box>
        {action}
      </Box>
    </Paper>
  );
}

const CustomTooltip = ({ active, payload, chartType = "payment" }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const labels = chartType === "payment" ? PAYMENT_LABELS : SUBSCRIPTION_LABELS;
    return (
      <Paper sx={{ p: 1.5, borderRadius: 1, boxShadow: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          {labels[data.payload.name] || data.payload.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.value} מנויים
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.payload.percentage}%
        </Typography>
      </Paper>
    );
  }
  return null;
};

const RenderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {`${percentage}%`}
    </text>
  );
};

function AnalyticsFilters({ from, to, onFrom, onTo }) {
  return (
    <Box className="analytics-filters">
      <Box className="filter-field-container">
        <Typography className="filter-label" variant="body2">
          מתאריך (חודש)
        </Typography>
        <TextField 
          type="month" 
          size="small" 
          value={from} 
          onChange={(e) => onFrom(e.target.value)}
          className="rtlFormControl"
          id="analytics-from-month"
          name="analytics_from_month"
          variant="outlined"
        />
      </Box>
      <Box className="filter-field-container">
        <Typography className="filter-label" variant="body2">
          עד תאריך (חודש)
        </Typography>
        <TextField 
          type="month" 
          size="small" 
          value={to} 
          onChange={(e) => onTo(e.target.value)}
          className="rtlFormControl"
          id="analytics-to-month"
          name="analytics_to_month"
          variant="outlined"
        />
      </Box>
    </Box>
  );
}

function MonthlySubsBar({ data }) {
  return (
    <Paper className="analytics-chart-card">
      <Typography className="analytics-chart-title">
        מנויים לפי חודשים
      </Typography>
      <Box className="analytics-chart-container">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <RTooltip />
              <Legend />
              <Bar dataKey="new" name="חדשים" fill="#8884d8" />
              <Bar dataKey="renew" name="חידושים" fill="#82ca9d" />
              <Bar dataKey="canceled" name="בוטלו" fill="#ffc658" />
              <Bar dataKey="expired" name="פגו" fill="#ff8042" />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <Box className="empty-state">
            <Typography className="empty-text">אין נתונים להצגה</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

function MonthlyPaymentsBar({ data }) {
  return (
    <Paper className="analytics-chart-card">
      <Typography className="analytics-chart-title">
        תשלומים לפי חודשים
      </Typography>
      <Box className="analytics-chart-container">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <RTooltip />
              <Legend />
              <Bar dataKey="paid" name="שולם" fill="#4caf50" />
              <Bar dataKey="pending" name="ממתין" fill="#ff9800" />
              <Bar dataKey="failed" name="נכשל" fill="#f44336" />
              <Bar dataKey="refunded" name="הוחזר" fill="#9c27b0" />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <Box className="empty-state">
            <Typography className="empty-text">אין נתונים להצגה</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

const monthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function Home() {
  const { user, authenticatedFetch, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  const [paymentPie, setPaymentPie] = React.useState([]);
  const [subscriptionPie, setSubscriptionPie] = React.useState([]);
  const [stats, setStats] = React.useState({
    users: 0,
    trainers: 0,
    activeSubs: 0,
    expiredSubs: 0,
    canceledSubs: 0,
    pausedSubs: 0,
    expiring7: 0,
    pendingPayments: 0,
  });

  const [from, setFrom] = React.useState(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    return monthStr(sixMonthsAgo);
  });
  const [to, setTo] = React.useState(() => monthStr(new Date()));
  const [subsData, setSubsData] = React.useState([]);
  const [payData, setPayData] = React.useState([]);

  React.useEffect(() => {
    if (user && !hasPermission('view_dashboard')) {
      navigate('/unauthorized');
    }
  }, [user]);

  const fetchDashboardData = React.useCallback(async () => {
    if (!hasPermission('view_dashboard')) return;
    
    setLoading(true);
    setErr("");
    
    try {
      const response = await authenticatedFetch(`/S/stats/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      
      const data = await response.json();
      const paymentStats = data.paymentStats || {};
      const subscriptionStats = data.subscriptionStats || {};
      
      const numericPaymentStats = {};
      Object.keys(paymentStats).forEach(key => {
        numericPaymentStats[key] = Number(paymentStats[key]) || 0;
      });
      
      const numericSubscriptionStats = {
        active: Number(subscriptionStats.active || data.activeSubs || 0),
        expired: Number(subscriptionStats.expired || data.expiredSubs || 0),
        canceled: Number(subscriptionStats.canceled || data.canceledSubs || 0),
        paused: Number(subscriptionStats.paused || data.pausedSubs || 0),
        total: Number(subscriptionStats.total || 0)
      };
      
      const totalPayments = Object.values(numericPaymentStats).reduce((sum, count) => sum + count, 0);
      const totalSubscriptions = numericSubscriptionStats.total > 0 
        ? numericSubscriptionStats.total 
        : numericSubscriptionStats.active + numericSubscriptionStats.expired + numericSubscriptionStats.canceled + numericSubscriptionStats.paused;
      
      const paymentPieData = Object.entries(numericPaymentStats)
        .filter(([,v]) => v > 0)
        .map(([name, value]) => ({ 
          name, 
          value,
          label: PAYMENT_LABELS[name] || name,
          percentage: totalPayments > 0 ? Math.round((value / totalPayments) * 100) : 0,
          color: PAYMENT_COLORS[name] || "#6a1b9a"
        }))
        .sort((a, b) => b.value - a.value);

      const subscriptionPieData = [
        { name: 'active', value: numericSubscriptionStats.active, label: 'פעיל' },
        { name: 'expired', value: numericSubscriptionStats.expired, label: 'פג תוקף' },
        { name: 'canceled', value: numericSubscriptionStats.canceled, label: 'בוטל' },
        { name: 'paused', value: numericSubscriptionStats.paused, label: 'מושהה' },
      ]
        .filter(item => item.value > 0)
        .map(item => ({
          ...item,
          percentage: totalSubscriptions > 0 ? Math.round((item.value / totalSubscriptions) * 100) : 0,
          color: SUBSCRIPTION_COLORS[item.name] || "#6a1b9a"
        }))
        .sort((a, b) => b.value - a.value);

      setPaymentPie(paymentPieData);
      setSubscriptionPie(subscriptionPieData);
      setStats({ 
        users: Number(data.users) || 0,
        trainers: Number(data.trainers) || 0,
        activeSubs: numericSubscriptionStats.active,
        expiredSubs: numericSubscriptionStats.expired,
        canceledSubs: numericSubscriptionStats.canceled,
        pausedSubs: numericSubscriptionStats.paused,
        expiring7: Number(data.expiring7) || 0,
        pendingPayments: Number(data.pendingPayments) || 0
      });
      
    } catch (e) {
      console.error('Fetch error:', e);
      setErr(e?.message || "שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, hasPermission]);

  const fetchAnalyticsData = React.useCallback(async () => {
    if (!hasPermission('view_analytics')) return;
    
    setAnalyticsLoading(true);
    setErr("");
    
    try {
      const [subsResponse, paysResponse] = await Promise.all([
        authenticatedFetch(`/analytics/subscriptions/monthly?from=${from}&to=${to}`),
        authenticatedFetch(`/analytics/payments/monthly?from=${from}&to=${to}`)
      ]);

      if (!subsResponse.ok) throw new Error('Failed to fetch subscriptions analytics');
      if (!paysResponse.ok) throw new Error('Failed to fetch payments analytics');

      const subs = await subsResponse.json();
      const pays = await paysResponse.json();

      const transformChartData = (labels, dataObj) => {
        return labels.map((label, index) => ({
          label,
          ...Object.keys(dataObj).reduce((acc, key) => {
            acc[key] = Number(dataObj[key]?.[index] ?? 0);
            return acc;
          }, {})
        }));
      };

      setSubsData(transformChartData(subs.labels || [], {
        new: subs.new || [],
        renew: subs.renew || [],
        canceled: subs.canceled || [],
        expired: subs.expired || []
      }));

      setPayData(transformChartData(pays.labels || [], {
        paid: pays.paid || [],
        pending: pays.pending || [],
        failed: pays.failed || [],
        refunded: pays.refunded || []
      }));

    } catch (error) {
      console.error('Analytics fetch error:', error);
      setErr('נכשל בטעינת נתוני ניתוח: ' + (error.message || 'שגיאת רשת'));
    } finally {
      setAnalyticsLoading(false);
    }
  }, [from, to, authenticatedFetch, hasPermission]);

  React.useEffect(() => { 
    fetchDashboardData(); 
  }, [fetchDashboardData]);

  React.useEffect(() => {
    if (activeTab === 1) {
      fetchAnalyticsData();
    }
  }, [activeTab, fetchAnalyticsData]);

  const PaymentIcon = ({ status }) => {
    switch (status) {
      case 'paid': return <Paid sx={{ fontSize: 16, color: PAYMENT_COLORS.paid }} />;
      case 'pending': return <Pending sx={{ fontSize: 16, color: PAYMENT_COLORS.pending }} />;
      case 'failed': return <Cancel sx={{ fontSize: 16, color: PAYMENT_COLORS.failed }} />;
      case 'refunded': return <Replay sx={{ fontSize: 16, color: PAYMENT_COLORS.refunded }} />;
      default: return null;
    }
  };

  const SubscriptionIcon = ({ status }) => {
    switch (status) {
      case 'active': return <PlayArrow sx={{ fontSize: 16, color: SUBSCRIPTION_COLORS.active }} />;
      case 'expired': return <Schedule sx={{ fontSize: 16, color: SUBSCRIPTION_COLORS.expired }} />;
      case 'canceled': return <Stop sx={{ fontSize: 16, color: SUBSCRIPTION_COLORS.canceled }} />;
      case 'paused': return <Pause sx={{ fontSize: 16, color: SUBSCRIPTION_COLORS.paused }} />;
      default: return null;
    }
  };

  const CustomLegend = ({ payload, chartType = "payment" }) => {
    const IconComponent = chartType === "payment" ? PaymentIcon : SubscriptionIcon;
    const labels = chartType === "payment" ? PAYMENT_LABELS : SUBSCRIPTION_LABELS;
    
    return (
      <Box className="pie-legend">
        {payload.map((entry, index) => (
          <Box key={`legend-${index}`} className="legend-item">
            <IconComponent status={entry.payload.name} />
            <Typography className="legend-text">
              {labels[entry.payload.name] || entry.payload.name}
            </Typography>
            <Box 
              className="legend-color"
              sx={{ backgroundColor: entry.color }}
            />
          </Box>
        ))}
      </Box>
    );
  };

  const renderDashboardTab = () => (
    <>
      <Box className="home__cards-grid">
        <StatCard title="סה״כ משתמשים" value={stats.users} icon={<Group />} color="#1976d2" />
        <StatCard title="מאמנים" value={stats.trainers} icon={<People />} color="#455a64" />
        <StatCard title="מנויים פעילים" value={stats.activeSubs} icon={<CheckCircle />} color="#2e7d32" />
        <StatCard title="מנויים שפגו" value={stats.expiredSubs} icon={<WarningAmber />} color="#c62828" />
        <StatCard 
          title="תשלומים ממתינים" 
          value={stats.pendingPayments} 
          icon={<Pending />} 
          color="#ed6c02" 
        />
        <StatCard
          title="יפוגו בשבוע הקרוב"
          value={stats.expiring7}
          icon={<Notifications />}
          color="#9c27b0"
        />
      </Box>

      <Box className="charts-container">
        <Paper className="chart-card">
          <Typography className="chart-title">
            סטטוסי מנויים
          </Typography>
          {subscriptionPie.length === 0 ? (
            <Box className="empty-state">
              <Typography className="empty-text">אין נתוני מנויים</Typography>
            </Box>
          ) : (
            <Box className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={subscriptionPie} 
                    dataKey="value" 
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    label={<RenderCustomizedLabel />}
                    labelLine={false}
                  >
                    {subscriptionPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RTooltip content={<CustomTooltip chartType="subscription" />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
          <CustomLegend payload={subscriptionPie.map(item => ({ payload: item, color: item.color }))} chartType="subscription" />
          <Typography className="chart-total">
            סה״כ {subscriptionPie.reduce((sum, item) => sum + item.value, 0)} מנויים
          </Typography>
        </Paper>

        <Paper className="chart-card">
          <Typography className="chart-title">
            סטטוסי תשלום
          </Typography>
          {paymentPie.length === 0 ? (
            <Box className="empty-state">
              <Typography className="empty-text">אין נתוני תשלומים</Typography>
            </Box>
          ) : (
            <Box className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={paymentPie} 
                    dataKey="value" 
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    label={<RenderCustomizedLabel />}
                    labelLine={false}
                  >
                    {paymentPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RTooltip content={<CustomTooltip chartType="payment" />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
          <CustomLegend payload={paymentPie.map(item => ({ payload: item, color: item.color }))} chartType="payment" />
          <Typography className="chart-total">
            סה״כ {paymentPie.reduce((sum, item) => sum + item.value, 0)} מנויים
          </Typography>
        </Paper>
      </Box>
    </>
  );

  const renderAnalyticsTab = () => (
    <Box className="analytics-tab">
      <AnalyticsFilters from={from} to={to} onFrom={setFrom} onTo={setTo} />
      
      {analyticsLoading ? (
        <Box className="analytics-loading">
          <CircularProgress />
        </Box>
      ) : (
        <Box className="analytics-charts-grid">
          <MonthlySubsBar data={subsData} />
          <MonthlyPaymentsBar data={payData} />
        </Box>
      )}
    </Box>
  );

  if (!user) {
    return (
      <Box className="home" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography>טוען...</Typography>
        </div>
      </Box>
    );
  }

  if (!hasPermission('view_dashboard')) {
    return (
      <Box className="home" dir="rtl">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Alert severity="error" sx={{ maxWidth: 400, margin: '0 auto' }}>
            אין לך הרשאות לצפות בדף הבית
          </Alert>
        </div>
      </Box>
    );
  }

  return (
    <Box 
      className="home" 
      dir="rtl"
      sx={{
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box className="main-content">
        <Box className="header-container">
          <Typography variant="h5" fontWeight={800}>דף הבית</Typography>
          <IconButton onClick={activeTab === 0 ? fetchDashboardData : fetchAnalyticsData} title="רענון נתונים">
            <Refresh />
          </IconButton>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<BarChart />} label="סטטיסטיקות" />
            <Tab icon={<Analytics />} label="ניתוח מתקדם" />
          </Tabs>
        </Box>

        {err && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {err}
          </Alert>
        )}

        {loading && activeTab === 0 ? (
          <Box className="loading-container">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 ? renderDashboardTab() : renderAnalyticsTab()}
          </>
        )}
      </Box>
    </Box>
  );
}
