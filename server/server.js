const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


let db_M = require('./db.js');
global.db_pool = db_M.pool;


app.use(cors({ origin: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173']), credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

global.addSlashes    = require('slashes').addSlashes;
global.stripSlashes  = require('slashes').stripSlashes;

const auth_R = require('./routers/auth_R');
app.use('/auth', auth_R);


const usr_R = require('./routers/users_R');
app.use('/U',usr_R);

const subscription_R = require('./routers/subscription_R.js');
app.use('/S',subscription_R);

const notificationsRouter = require('./routers/notifications_R');
app.use('/notifications', notificationsRouter);

const analytics_R = require('./routers/analytics_R');
app.use('/analytics', analytics_R);

const rbac_R = require('./routers/rbac_R');
app.use('/rbac', rbac_R);

const staff_R = require('./routers/staff_R');
app.use('/staff', staff_R);

const bodyDetails_R = require('./routers/bodyDetails_R');
app.use('/body-details', bodyDetails_R);

const { notifyUpcomingRenewals, notifyFailedPayments } = require('./jobs/notifications_jobs');

async function runJobs() {
  try {
    console.log(`[Jobs] Starting notification jobs at ${new Date().toISOString()}`);
    const renewalsCount = await notifyUpcomingRenewals(7);
    const failedPaymentsCount = await notifyFailedPayments();
    
    if (renewalsCount > 0 || failedPaymentsCount > 0) {
      console.log(`[Jobs] Notifications created: renewals=${renewalsCount}, failed_payments=${failedPaymentsCount}`);
    }
  } catch (error) {
    console.error('[Jobs] Error running notification jobs:', error);
  }
}

if (process.env.NODE_ENV !== 'test') {
  setInterval(runJobs, 15 * 60 * 1000);
  setTimeout(runJobs, 10000); 
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

