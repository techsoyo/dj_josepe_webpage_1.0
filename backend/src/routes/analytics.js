import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, handleValidationErrors } from '../middleware/security.js';
import { validatePagination, commonValidations } from '../utils/validation.js';
import {
  findRecords,
  createRecord,
  countRecords,
  paginate,
  buildSortQuery,
  deleteRecord  // ✅ CORRECCIÓN LÍNEA 8: Agregar deleteRecord import
} from '../utils/database.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Track analytics event (public endpoint)
router.post('/track', asyncHandler(async (req, res) => {
  const { metric, value = 1, properties = {}, page } = req.body;

  if (!metric) {
    return res.status(400).json({ error: 'Metric is required' });
  }

  // Add request metadata
  const analyticsData = {
    metric,
    value: parseFloat(value) || 1,
    properties: typeof properties === 'object' ? properties : {},
    page: page || req.get('Referer') || null,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip || req.connection.remoteAddress,
    sessionId: req.get('X-Session-ID') || null,
    date: new Date()  // ✅ MEJORA: Agregar timestamp explícito
  };

  // Extract additional info from user agent
  const userAgent = analyticsData.userAgent || '';

  // Simple device detection
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    analyticsData.device = 'mobile';
  } else if (/Tablet|iPad/.test(userAgent)) {
    analyticsData.device = 'tablet';
  } else {
    analyticsData.device = 'desktop';
  }

  // Simple browser detection
  if (userAgent.includes('Chrome')) {
    analyticsData.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    analyticsData.browser = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    analyticsData.browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    analyticsData.browser = 'Edge';
  } else {
    analyticsData.browser = 'Other';
  }

  // Get referrer
  analyticsData.referrer = req.get('Referer') || null;

  try {
    await createRecord('analytics', analyticsData);

    res.status(201).json({
      message: 'Event tracked successfully',
      timestamp: analyticsData.date
    });
  } catch (error) {
    console.error('❌ Error tracking analytics:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
}));

// Get analytics data
router.get('/', validatePagination, handleValidationErrors, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
    sort = 'date',
    order = 'desc',
    metric,
    startDate,
    endDate,
    device,
    browser
  } = req.query;

  const where = {
    ...(metric && { metric }),
    ...(device && { device }),
    ...(browser && { browser })
  };

  // Date range filter - MySQL compatible
  let dateCondition = '';
  let dateValues = [];

  if (startDate && endDate) {
    dateCondition = 'date BETWEEN ? AND ?';
    dateValues = [new Date(startDate), new Date(endDate)];
  } else if (startDate) {
    dateCondition = 'date >= ?';
    dateValues = [new Date(startDate)];
  } else if (endDate) {
    dateCondition = 'date <= ?';
    dateValues = [new Date(endDate)];
  }

  try {
    const pagination = paginate(parseInt(page), parseInt(limit));

    // Build custom query for analytics with date filtering
    const connection = await pool.getConnection();
    try {
      let query = `SELECT * FROM analytics`;
      let countQuery = `SELECT COUNT(*) as count FROM analytics`;
      let values = [];
      let countValues = [];

      // WHERE clause for main query
      const whereConditions = [];
      if (Object.keys(where).length > 0) {
        const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        whereConditions.push(conditions);
        values = Object.values(where);
        countValues = [...values];
      }

      if (dateCondition) {
        whereConditions.push(dateCondition);
        values = [...values, ...dateValues];
        countValues = [...countValues, ...dateValues];
      }

      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        query += ` WHERE ${whereClause}`;
        countQuery += ` WHERE ${whereClause}`;
      }

      // ORDER BY clause
      query += ` ORDER BY date ${order.toUpperCase()}`;

      // LIMIT and OFFSET
      query += ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;

      const [analytics] = await connection.execute(query, values);
      const [countResult] = await connection.execute(countQuery, countValues);

      connection.release();

      res.json({
        data: analytics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].count,
          pages: Math.ceil(countResult[0].count / limit)
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
}));

// Get analytics summary
router.get('/summary', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};

  // Date range filter
  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  try {
    const [
      totalEvents,
      pageViews,
      uniquePages,
      deviceBreakdown,
      browserBreakdown,
      topPages,
      topReferrers
    ] = await Promise.all([
      countRecords('analytics', where),
      countRecords('analytics', { ...where, metric: 'page_view' }),
      findRecords('analytics', {
        where: { ...where, page: { not: null } },
        select: { page: true },
        distinct: ['page']
      }),
      findRecords('analytics', {
        where: { ...where, device: { not: null } },
        select: { device: true },
        distinct: ['device']
      }),
      findRecords('analytics', {
        where: { ...where, browser: { not: null } },
        select: { browser: true },
        distinct: ['browser']
      }),
      findRecords('analytics', {
        where: { ...where, page: { not: null } },
        select: { page: true },
        take: 10
      }),
      findRecords('analytics', {
        where: { ...where, referrer: { not: null } },
        select: { referrer: true },
        take: 10
      })
    ]);

    // Count occurrences for top pages and referrers
    const pageCount = {};
    const referrerCount = {};

    topPages.forEach(item => {
      pageCount[item.page] = (pageCount[item.page] || 0) + 1;
    });

    topReferrers.forEach(item => {
      referrerCount[item.referrer] = (referrerCount[item.referrer] || 0) + 1;
    });

    const topPagesList = Object.entries(pageCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    const topReferrersList = Object.entries(referrerCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    res.json({
      totalEvents,
      pageViews,
      uniquePages: uniquePages.length,
      deviceBreakdown: deviceBreakdown.map(d => d.device),
      browserBreakdown: browserBreakdown.map(b => b.browser),
      topPages: topPagesList,
      topReferrers: topReferrersList
    });
  } catch (error) {
    console.error('❌ Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics summary' });
  }
}));

// Get metrics breakdown
router.get('/metrics', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};

  // Date range filter
  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  try {
    const metrics = await findRecords('analytics', {
      where: { ...where, metric: { not: null } },
      select: { metric: true },
      distinct: ['metric']
    });

    const metricCounts = {};

    for (const metricItem of metrics) {
      const count = await countRecords('analytics', {
        ...where,
        metric: metricItem.metric
      });
      metricCounts[metricItem.metric] = count;
    }

    res.json(metricCounts);
  } catch (error) {
    console.error('❌ Error getting metrics breakdown:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics breakdown' });
  }
}));

// Get daily analytics
router.get('/daily', asyncHandler(async (req, res) => {
  const { days = 30, metric } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const where = {
    date: { gte: startDate },
    ...(metric && { metric })
  };

  try {
    const analytics = await findRecords('analytics', {
      where,
      select: {
        date: true,
        metric: true,
        value: true
      },
      orderBy: { date: 'asc' }
    });

    // Group by date
    const dailyData = {};

    analytics.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          total: 0,
          metrics: {}
        };
      }

      dailyData[dateKey].total += item.value;

      if (!dailyData[dateKey].metrics[item.metric]) {
        dailyData[dateKey].metrics[item.metric] = 0;
      }
      dailyData[dateKey].metrics[item.metric] += item.value;
    });

    const result = Object.values(dailyData).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error getting daily analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve daily analytics' });
  }
}));

// Get real-time analytics (last hour)
router.get('/realtime', asyncHandler(async (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    const [
      recentEvents,
      activePages,
      recentMetrics
    ] = await Promise.all([
      findRecords('analytics', {
        where: { date: { gte: oneHourAgo } },
        orderBy: { date: 'desc' },
        take: 50
      }),
      findRecords('analytics', {
        where: {
          date: { gte: oneHourAgo },
          metric: 'page_view',
          page: { not: null }
        },
        select: { page: true },
        distinct: ['page']
      }),
      findRecords('analytics', {
        where: { date: { gte: oneHourAgo } },
        select: { metric: true },
        distinct: ['metric']
      })
    ]);

    const metricCounts = {};
    for (const metricItem of recentMetrics) {
      const count = await countRecords('analytics', {
        date: { gte: oneHourAgo },
        metric: metricItem.metric
      });
      metricCounts[metricItem.metric] = count;
    }

    res.json({
      totalEvents: recentEvents.length,
      activePages: activePages.length,
      recentEvents: recentEvents.slice(0, 10),
      metricCounts
    });
  } catch (error) {
    console.error('❌ Error getting real-time analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve real-time analytics' });
  }
}));

// Clean old analytics data
router.delete('/cleanup', asyncHandler(async (req, res) => {
  const { days = 90 } = req.query;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  try {
    // ✅ CORRECCIÓN LÍNEA 360: Primero obtener los records a eliminar
    const recordsToDelete = await findRecords('analytics', {
      where: { date: { lt: cutoffDate } }
    });

    // ✅ CORRECCIÓN LÍNEA 365: Ahora deleteRecord funciona correctamente
    const deletePromises = recordsToDelete.map(record =>
      deleteRecord('analytics', record.id)  // Simplificado, solo ID
    );

    await Promise.all(deletePromises);

    res.json({
      message: `Cleaned up analytics data older than ${days} days`,
      deletedCount: recordsToDelete.length
    });
  } catch (error) {
    console.error('❌ Error cleaning up analytics:', error);
    res.status(500).json({ error: 'Failed to cleanup analytics data' });
  }
}));

// Delete specific analytics event (admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await deleteRecord('analytics', parseInt(id));

    res.json({
      message: 'Analytics event deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting analytics event:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Analytics event not found' });
    }
    res.status(500).json({ error: 'Failed to delete analytics event' });
  }
}));

export default router;
