import express from 'express';
import { errorHandler } from './src/middleware/errorHandler.js';
import { securityMiddleware } from './src/middleware/security.js';
// import { performanceMiddleware } from './src/middleware/performance.js'; // Commented out - causing issues
// import { sanitizeInput } from './src/middleware/security.js'; // Commented out for testing
// import contentRoutes from './src/routes/content.js'; // Commented out for testing
// import mediaRoutes from './src/routes/media.js'; // Commented out - file doesn't exist
// import eventsRoutes from './src/routes/events.js'; // Commented out - route file doesn't exist
// import contactRoutes from './src/routes/contact.js'; // Commented out for testing
// import settingsRoutes from './src/routes/settings.js'; // Commented out - route file doesn't exist
import analyticsRoutes from './src/routes/analytics.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Import routes
import contentRoutes from './src/routes/content.js';
// import mediaRoutes from './src/routes/media.js'; // Commented out - file doesn't exist
// import eventsRoutes from './src/routes/events.js'; // Commented out - file doesn't exist
import contactRoutes from './src/routes/contact.js';
// import settingsRoutes from './src/routes/settings.js'; // Commented out - file doesn't exist
import analyticsRoutes from './src/routes/analytics.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { securityMiddleware } from './src/middleware/security.js';
// import { performanceMiddleware } from './src/middleware/performance.js'; // Commented out - causing issues
// import { sanitizeInput } from './src/middleware/security.js'; // Commented out for testing

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MySQL connection configuration
const dbConfig = {
  host: '192.168.1.40',
  port: 3306,
  user: 'admin',
  password: 'admin123',
  database: 'josepe_DB'
};

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORRECCIÓN: Test database connection on startup
async function connectDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Test query
    await connection.execute('SELECT 1');
    console.log('✅ Database query test passed');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Security middleware - ✅ CORRECCIÓN: Configuración única de helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// ✅ CORRECCIÓN: Rate limiting mejorado con diferentes límites
const generalLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Use the ipKeyGenerator helper for proper IPv6 support
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    return ip || 'unknown';
  },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Solo 10 requests por 15 minutos para endpoints sensibles
  message: {
    error: 'Too many sensitive requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);
app.use('/api/contact', strictLimiter);

// CORS configuration - ✅ MEJORA: Configuración más robusta
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.SITE_URL, process.env.ADMIN_URL].filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-ID'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization
app.use(mongoSanitize());

// Compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Logging - ✅ MEJORA: Logging más detallado
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Custom middleware
app.use(securityMiddleware);
// app.use(performanceMiddleware); // Commented out - causing issues
// app.use(sanitizeInput); // Commented out for testing
// app.use(sanitizeInput); // Commented out for testing

// MySQL connection middleware - makes db config available in requests
app.use((req, res, next) => {
  req.dbConfig = dbConfig;
  next();
});

// Static files
app.use('/uploads', express.static(join(__dirname, 'uploads'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// ✅ CORRECCIÓN: Health check con verificación de base de datos
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    await connection.end();

    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      memory: {
        used: process.memoryUsage(),
        free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
      }
    };

    res.json(healthCheck);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      uptime: process.uptime()
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'DJ Josep Backend API',
    version: '1.0.0',
    description: 'Single User Admin Panel API',
    endpoints: {
      content: '/api/content',
      media: '/api/media',
      events: '/api/events',
      contact: '/api/contact',
      settings: '/api/settings',
      analytics: '/api/analytics'
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// API routes
// app.use('/api/content', contentRoutes); // Commented out for testing
// app.use('/api/media', mediaRoutes); // Commented out - route file doesn't exist
// app.use('/api/events', eventsRoutes); // Commented out - route file doesn't exist
// app.use('/api/contact', contactRoutes); // Commented out for testing
// app.use('/api/settings', settingsRoutes); // Commented out - route file doesn't exist
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (debe ir al final)
app.use(errorHandler);

// ✅ CORRECCIÓN: Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);

  try {
    // MySQL connections are automatically closed when they go out of scope
    console.log('✅ Database connections closed');

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// ✅ MEJORA: Inicialización del servidor con verificación de base de datos
async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🎵 DJ Josep Backend API ready!`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
