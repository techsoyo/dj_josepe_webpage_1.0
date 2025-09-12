import { validationResult } from 'express-validator';

// Security headers middleware
export const securityMiddleware = (req, res, next) => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent caching of sensitive data
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potentially dangerous characters
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol (except for images)
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// File upload security
export const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed`);
    }

    // Check file extension
    const extension = file.originalname.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new Error(`File extension .${extension} not allowed`);
    }

    // Check for null bytes (potential path traversal)
    if (file.originalname.includes('\0')) {
      throw new Error('Invalid filename');
    }

    return true;
  };

  try {
    if (req.file) {
      validateFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(validateFile);
      } else {
        Object.values(req.files).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            fileArray.forEach(validateFile);
          } else {
            validateFile(fileArray);
          }
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      error: 'File validation failed',
      message: error.message
    });
  }
};

// IP whitelist middleware (optional)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized'
      });
    }

    next();
  };
};