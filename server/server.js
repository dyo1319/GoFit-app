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

const subscriptionPlans_R = require('./routers/subscriptionPlans_R.js');
app.use('/subscription-plans', subscriptionPlans_R);

const invoices_R = require('./routers/invoices_R.js');
app.use('/invoices', invoices_R);


const analytics_R = require('./routers/analytics_R');
app.use('/analytics', analytics_R);

const rbac_R = require('./routers/rbac_R');
app.use('/rbac', rbac_R);

const staff_R = require('./routers/staff_R');
app.use('/staff', staff_R);

const bodyDetails_R = require('./routers/bodyDetails_R');
app.use('/body-details', bodyDetails_R);

const exercises_R = require('./routers/exercises_R');
app.use('/exercises', exercises_R);

const trainingPrograms_R = require('./routers/trainingPrograms_R');
app.use('/training-programs', trainingPrograms_R);


const workoutHistory_R = require('./routers/workoutHistory_R');
app.use('/workout-history', workoutHistory_R);

const notifications_R = require('./routers/notifications_R');
app.use('/notifications', notifications_R);

const { startCleanupScheduler } = require('./services/notificationCleanup');
const db = global.db_pool.promise();
startCleanupScheduler(db);



app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.listen(PORT, () => {
});

