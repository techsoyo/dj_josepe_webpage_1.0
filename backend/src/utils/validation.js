import { body, param, query } from 'express-validator';

// Common validation rules
export const commonValidations = {
  id: param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  slug: param('slug').isSlug().withMessage('Invalid slug format'),
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  phone: body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  url: body('url').optional().isURL().withMessage('Invalid URL format'),
  boolean: (field) => body(field).optional().isBoolean().withMessage(`${field} must be boolean`),
  string: (field, min = 1, max = 255) =>
    body(field).isString().trim().isLength({ min, max }).withMessage(`${field} must be between ${min} and ${max} characters`),
  text: (field, max = 5000) =>
    body(field).isString().trim().isLength({ max }).withMessage(`${field} must not exceed ${max} characters`),
  integer: (field, min = 0) =>
    body(field).optional().isInt({ min }).withMessage(`${field} must be a positive integer`),
  date: (field) =>
    body(field).optional().isISO8601().withMessage(`${field} must be a valid date`),
  array: (field) =>
    body(field).optional().isArray().withMessage(`${field} must be an array`)
};

// Content validation
export const validateBlogPost = [
  commonValidations.string('title', 1, 200),
  commonValidations.string('slug', 1, 200),
  commonValidations.text('excerpt', 500),
  commonValidations.text('content'),
  commonValidations.string('seo_title', 1, 60).optional(),
  commonValidations.text('seo_description', 160).optional(),
  commonValidations.string('tags', 0, 500).optional(),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  commonValidations.boolean('featured'),
  commonValidations.boolean('published'),
  commonValidations.date('publishedAt'),
  commonValidations.date('scheduledFor'),
  commonValidations.integer('coverPhotoId')
];

// Event validation
export const validateEvent = [
  commonValidations.string('title', 1, 200),
  commonValidations.string('slug', 1, 200),
  commonValidations.text('description'),
  commonValidations.text('shortDescription', 300).optional(),
  commonValidations.string('venue', 1, 200),
  commonValidations.string('address', 0, 300).optional(),
  commonValidations.string('city', 0, 100).optional(),
  commonValidations.string('country', 0, 100).optional(),
  commonValidations.string('coordinates', 0, 50).optional(),
  commonValidations.date('date'),
  commonValidations.date('endDate').optional(),
  commonValidations.string('time', 0, 20).optional(),
  commonValidations.string('endTime', 0, 20).optional(),
  commonValidations.string('timezone', 0, 50).optional(),
  commonValidations.string('price', 0, 50).optional(),
  commonValidations.string('currency', 0, 10).optional(),
  commonValidations.url.optional(),
  body('ticketUrl').optional().isURL().withMessage('Invalid ticket URL'),
  body('facebookUrl').optional().isURL().withMessage('Invalid Facebook URL'),
  body('instagramUrl').optional().isURL().withMessage('Invalid Instagram URL'),
  body('status').optional().isIn(['scheduled', 'ongoing', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('eventType').optional().isIn(['performance', 'festival', 'private']).withMessage('Invalid event type'),
  commonValidations.integer('capacity'),
  commonValidations.integer('attendees'),
  commonValidations.boolean('featured'),
  commonValidations.boolean('soldOut'),
  commonValidations.boolean('published'),
  commonValidations.string('seo_title', 0, 60).optional(),
  commonValidations.text('seo_description', 160).optional(),
  commonValidations.integer('coverPhotoId')
];

// Music set validation
export const validateMusicSet = [
  commonValidations.string('title', 1, 200),
  commonValidations.string('slug', 1, 200),
  commonValidations.text('description').optional(),
  commonValidations.string('genre', 0, 100).optional(),
  commonValidations.string('subgenre', 0, 100).optional(),
  commonValidations.string('bpm', 0, 20).optional(),
  commonValidations.string('duration', 0, 20).optional(),
  commonValidations.date('releaseDate').optional(),
  commonValidations.string('recordedAt', 0, 200).optional(),
  commonValidations.string('mood', 0, 100).optional(),
  commonValidations.string('tags', 0, 500).optional(),
  body('soundcloudUrl').optional().isURL().withMessage('Invalid SoundCloud URL'),
  body('mixcloudUrl').optional().isURL().withMessage('Invalid Mixcloud URL'),
  body('youtubeUrl').optional().isURL().withMessage('Invalid YouTube URL'),
  body('spotifyUrl').optional().isURL().withMessage('Invalid Spotify URL'),
  body('beatportUrl').optional().isURL().withMessage('Invalid Beatport URL'),
  body('downloadUrl').optional().isURL().withMessage('Invalid download URL'),
  commonValidations.boolean('featured'),
  commonValidations.boolean('exclusive'),
  commonValidations.boolean('liveRecording'),
  body('quality').optional().isIn(['low', 'medium', 'high', 'lossless']).withMessage('Invalid quality'),
  commonValidations.string('seo_title', 0, 60).optional(),
  commonValidations.text('seo_description', 160).optional(),
  commonValidations.boolean('published'),
  commonValidations.integer('coverPhotoId')
];

// Track validation
export const validateTrack = [
  commonValidations.string('title', 1, 200),
  commonValidations.string('artist', 1, 200),
  commonValidations.string('album', 0, 200).optional(),
  commonValidations.string('label', 0, 200).optional(),
  commonValidations.integer('year'),
  commonValidations.string('genre', 0, 100).optional(),
  commonValidations.integer('bpm'),
  commonValidations.string('key', 0, 10).optional(),
  commonValidations.string('duration', 0, 20).optional(),
  commonValidations.integer('durationSeconds'),
  commonValidations.integer('position'),
  commonValidations.string('startTime', 0, 20).optional(),
  commonValidations.string('endTime', 0, 20).optional(),
  commonValidations.text('notes', 500).optional(),
  commonValidations.string('transition', 0, 100).optional(),
  commonValidations.string('spotifyId', 0, 100).optional(),
  commonValidations.string('beatportId', 0, 100).optional(),
  commonValidations.integer('setId')
];

// Contact message validation
export const validateContactMessage = [
  commonValidations.string('name', 1, 100),
  commonValidations.email,
  commonValidations.phone.optional(),
  commonValidations.string('company', 0, 200).optional(),
  commonValidations.string('subject', 0, 200).optional(),
  commonValidations.text('message', 2000),
  body('type').optional().isIn(['general', 'booking', 'collaboration']).withMessage('Invalid message type'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  commonValidations.string('source', 0, 50).optional()
];

// Testimonial validation
export const validateTestimonial = [
  commonValidations.string('name', 1, 100),
  commonValidations.email.optional(),
  commonValidations.phone.optional(),
  commonValidations.string('company', 0, 200).optional(),
  commonValidations.string('position', 0, 100).optional(),
  body('website').optional().isURL().withMessage('Invalid website URL'),
  commonValidations.text('content', 1000),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  commonValidations.string('eventType', 0, 100).optional(),
  commonValidations.date('eventDate').optional(),
  commonValidations.string('location', 0, 200).optional(),
  commonValidations.boolean('featured'),
  commonValidations.boolean('verified'),
  body('source').optional().isIn(['website', 'email', 'phone']).withMessage('Invalid source'),
  commonValidations.string('tags', 0, 500).optional(),
  commonValidations.boolean('published')
];

// Gallery photo validation
export const validateGalleryPhoto = [
  commonValidations.string('title', 0, 200).optional(),
  commonValidations.text('description', 500).optional(),
  commonValidations.string('alt', 0, 200).optional(),
  commonValidations.string('tags', 0, 500).optional(),
  commonValidations.string('category', 0, 100).optional(),
  commonValidations.string('location', 0, 200).optional(),
  commonValidations.boolean('featured'),
  commonValidations.boolean('isPublic')
];

// Site config validation
export const validateSiteConfig = [
  commonValidations.string('key', 1, 100),
  commonValidations.text('value'),
  body('type').optional().isIn(['string', 'number', 'boolean', 'json', 'file']).withMessage('Invalid config type'),
  body('category').optional().isIn(['general', 'seo', 'social', 'appearance']).withMessage('Invalid category'),
  commonValidations.text('description', 500).optional(),
  commonValidations.boolean('isPublic'),
  commonValidations.boolean('editable')
];

// Query parameter validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isString().withMessage('Sort must be a string'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
];

export const validateSearch = [
  query('q').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('status').optional().isString().withMessage('Status must be a string')
];

// Handle validation errors middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Input sanitization function
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove potential script injections
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs that might contain scripts
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};
