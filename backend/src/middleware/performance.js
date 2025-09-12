// Performance monitoring middleware
export const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Add request ID for tracking
  req.requestId = Math.random().toString(36).substr(2, 9);
  
  // Override res.json to add performance headers
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Request-ID', req.requestId);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Cache control middleware
export const cacheControl = (maxAge = 3600) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      res.setHeader('ETag', `"${Date.now()}"`);
    }
    next();
  };
};

// Compression middleware for specific routes
export const conditionalCompression = (req, res, next) => {
  // Don't compress images or already compressed files
  const skipCompression = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.zip', '.gz', '.br', '.mp4', '.mp3'
  ];
  
  const shouldSkip = skipCompression.some(ext => 
    req.path.toLowerCase().endsWith(ext)
  );
  
  if (shouldSkip) {
    res.setHeader('X-Compression-Skipped', 'true');
  }
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };
  
  // Log memory warnings
  if (memUsageMB.heapUsed > 100) {
    console.warn(`High memory usage detected: ${memUsageMB.heapUsed}MB`);
  }
  
  // Add memory info to response headers in development
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('X-Memory-Usage', JSON.stringify(memUsageMB));
  }
  
  next();
};

// Request size limiter
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = typeof maxSize === 'string' 
      ? parseSize(maxSize) 
      : maxSize;
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: formatSize(maxSizeBytes),
        receivedSize: formatSize(contentLength)
      });
    }
    
    next();
  };
};

// Helper functions
function parseSize(size) {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
}

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`;
}