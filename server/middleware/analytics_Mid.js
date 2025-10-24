function monthRange(fromYM, toYM) {
  const [fy, fm] = fromYM.split("-").map(Number);
  const [ty, tm] = toYM.split("-").map(Number);
  const out = [];
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m === 13) { m = 1; y += 1; }
  }
  return out;
}

function getMonthBoundsSQL() {
  return {
    startCondition: "s.start_date >= STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')",
    endCondition: "s.start_date < DATE_ADD(LAST_DAY(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')), INTERVAL 1 DAY)",
    cancelCondition: "s.cancelled_at >= STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d') AND s.cancelled_at < DATE_ADD(LAST_DAY(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')), INTERVAL 1 DAY)",
    expireCondition: "s.end_date >= STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d') AND s.end_date < DATE_ADD(LAST_DAY(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')), INTERVAL 1 DAY)",
    paymentCondition: "s.start_date >= STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d') AND s.start_date < DATE_ADD(LAST_DAY(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')), INTERVAL 1 DAY)"
  };
}

async function getMonthlySubscriptions(req, res) {
  try {
    const db = global.db_pool.promise();
    const from = String(req.query.from || "").trim();
    const to   = String(req.query.to   || "").trim();
    
    if (!/^\d{4}-\d{2}$/.test(from) || !/^\d{4}-\d{2}$/.test(to)) {
      return res.status(400).json({ error: "from/to must be YYYY-MM" });
    }

    const labels = monthRange(from, to);
    const bounds = getMonthBoundsSQL();

    const [rowsStart] = await db.execute(
      `SELECT DATE_FORMAT(s.start_date, '%Y-%m') AS ym,
              SUM(CASE WHEN NOT EXISTS (
                    SELECT 1 FROM subscriptions s2
                    WHERE s2.user_id = s.user_id
                      AND s2.start_date < s.start_date
                  ) THEN 1 ELSE 0 END) AS new_cnt,
              SUM(CASE WHEN EXISTS (
                    SELECT 1 FROM subscriptions s2
                    WHERE s2.user_id = s.user_id
                      AND s2.start_date < s.start_date
                  ) THEN 1 ELSE 0 END) AS renew_cnt
       FROM subscriptions s
       WHERE ${bounds.startCondition}
         AND ${bounds.endCondition}
       GROUP BY ym`,
      [from, to]  
    );

    const [rowsCanceled] = await db.execute(
      `SELECT DATE_FORMAT(s.cancelled_at, '%Y-%m') AS ym,
              COUNT(*) AS canceled_cnt
       FROM subscriptions s
       WHERE s.cancelled_at IS NOT NULL
         AND ${bounds.cancelCondition}
       GROUP BY ym`,
      [from, to]  
    );

    const [rowsExpired] = await db.execute(
      `SELECT DATE_FORMAT(s.end_date, '%Y-%m') AS ym,
              COUNT(*) AS expired_cnt
       FROM subscriptions s
       WHERE s.end_date IS NOT NULL
         AND s.cancelled_at IS NULL
         AND ${bounds.expireCondition}
       GROUP BY ym`,
      [from, to] 
    );

    const byYM = Object.fromEntries(labels.map(l => [l, { new:0, renew:0, canceled:0, expired:0 }]));
    
    rowsStart.forEach(r => { 
      if (byYM[r.ym]) { 
        byYM[r.ym].new = Number(r.new_cnt||0); 
        byYM[r.ym].renew = Number(r.renew_cnt||0); 
      }
    });
    rowsCanceled.forEach(r => { 
      if (byYM[r.ym]) byYM[r.ym].canceled = Number(r.canceled_cnt||0); 
    });
    rowsExpired.forEach(r => { 
      if (byYM[r.ym]) byYM[r.ym].expired = Number(r.expired_cnt||0); 
    });

    res.json({
      labels,
      new:      labels.map(l => byYM[l].new),
      renew:    labels.map(l => byYM[l].renew),
      canceled: labels.map(l => byYM[l].canceled),
      expired:  labels.map(l => byYM[l].expired),
    });
  } catch (error) {
    console.error('Analytics monthly subscriptions error:', error);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

async function getMonthlyPayments(req, res) {
  try {
    const db = global.db_pool.promise();
    const from = String(req.query.from || "").trim();
    const to   = String(req.query.to   || "").trim();
    
    if (!/^\d{4}-\d{2}$/.test(from) || !/^\d{4}-\d{2}$/.test(to)) {
      return res.status(400).json({ error: "from/to must be YYYY-MM" });
    }

    const labels = monthRange(from, to);
    const bounds = getMonthBoundsSQL();

    const [rows] = await db.execute(
      `SELECT DATE_FORMAT(s.start_date, '%Y-%m') AS ym,
              s.payment_status AS st,
              COUNT(*) AS cnt
       FROM subscriptions s
       WHERE ${bounds.paymentCondition}
         AND s.payment_status IS NOT NULL
       GROUP BY ym, st`,
      [from, to]  
    );

    const byYM = Object.fromEntries(labels.map(l => [l, { paid:0, pending:0, failed:0, refunded:0 }]));
    
    rows.forEach(r => {
      const ym = r.ym;
      if (!byYM[ym]) return;
      const st = String(r.st);
      if (byYM[ym][st] != null) {
        byYM[ym][st] += Number(r.cnt||0);
      }
    });

    res.json({
      labels,
      paid:     labels.map(l => byYM[l].paid),
      pending:  labels.map(l => byYM[l].pending),
      failed:   labels.map(l => byYM[l].failed),
      refunded: labels.map(l => byYM[l].refunded),
    });
  } catch (error) {
    console.error('Analytics monthly payments error:', error);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

async function getDashboardStats(req, res) {
  try {
    const db = global.db_pool.promise();
    
    const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
    const [trainersCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "trainer"');
    
    const [subscriptionStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN cancelled_at IS NOT NULL THEN 1 ELSE 0 END) as canceled,
        SUM(CASE WHEN paused_at IS NOT NULL THEN 1 ELSE 0 END) as paused,
        SUM(CASE WHEN cancelled_at IS NULL AND paused_at IS NULL AND end_date >= CURDATE() THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN cancelled_at IS NULL AND paused_at IS NULL AND end_date < CURDATE() THEN 1 ELSE 0 END) as expired
      FROM subscriptions
    `);

    const [paymentStats] = await db.query(`
      SELECT payment_status, COUNT(*) as count 
      FROM subscriptions 
      GROUP BY payment_status
    `);

    const [expiringSubs] = await db.query(`
      SELECT COUNT(*) as count 
      FROM subscriptions 
      WHERE cancelled_at IS NULL 
        AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    res.json({
      users: usersCount[0].count,
      trainers: trainersCount[0].count,
      activeSubs: subscriptionStats[0].active,
      expiredSubs: subscriptionStats[0].expired,
      canceledSubs: subscriptionStats[0].canceled,
      pausedSubs: subscriptionStats[0].paused,
      expiring7: expiringSubs[0].count,
      paymentStats: paymentStats.reduce((acc, curr) => {
        acc[curr.payment_status] = curr.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Analytics dashboard stats error:', error);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

function buildSafeQuery(baseSQL, conditions = [], params = []) {
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return {
    sql: `${baseSQL} ${whereClause}`,
    params: params
  };
}

async function getSubscriptionTrends(req, res) {
  try {
    const db = global.db_pool.promise();
    const { year } = req.query;
    
    if (!year || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: "Valid year (YYYY) required" });
    }

    const bounds = getMonthBoundsSQL();
    const conditions = [
      "s.start_date >= STR_TO_DATE(CONCAT(?, '-01-01'), '%Y-%m-%d')",
      "s.start_date < STR_TO_DATE(CONCAT(?, '-12-31'), '%Y-%m-%d')"
    ];
    
    const { sql, params } = buildSafeQuery(
      `SELECT 
        MONTH(s.start_date) as month,
        COUNT(*) as count
       FROM subscriptions s`,
      conditions,
      [year, year]
    );

    const [rows] = await db.execute(sql, params);
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthData = rows.find(r => r.month === i + 1);
      return monthData ? monthData.count : 0;
    });

    res.json({
      year: parseInt(year),
      monthlyData
    });
  } catch (error) {
    console.error('Analytics subscription trends error:', error);
    res.status(500).json({ error: "שגיאת שרת" });
  }
}

module.exports = {
  getMonthlySubscriptions,
  getMonthlyPayments,
  getDashboardStats,
  getSubscriptionTrends,
  monthRange, 
  getMonthBoundsSQL 
};
