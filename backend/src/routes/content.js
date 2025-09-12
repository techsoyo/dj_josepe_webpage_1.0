import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, handleValidationErrors } from '../middleware/security.js';
import { 
  validateBlogPost, 
  validateMusicSet, 
  validateTrack, 
  validateTestimonial,
  validatePagination,
  validateSearch,
  commonValidations 
} from '../utils/validation.js';
import {
  findRecords,
  findRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  countRecords,
  paginate,
  buildSearchQuery,
  buildSortQuery
} from '../utils/database.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Blog Posts Routes
router.get('/blog', validatePagination, validateSearch, handleValidationErrors, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', q, status } = req.query;
  
  const where = {
    ...(status && { status }),
    ...(q && buildSearchQuery(q, ['title', 'excerpt', 'content', 'tags']))
  };

  const [posts, total] = await Promise.all([
    findRecords('blogPost', {
      where,
      include: { coverPhoto: true },
      orderBy: buildSortQuery(sort, order),
      ...paginate(parseInt(page), parseInt(limit))
    }),
    countRecords('blogPost', where)
  ]);

  res.json({
    data: posts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.get('/blog/:id', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  const post = await findRecord('blogPost', { id: parseInt(req.params.id) }, {
    coverPhoto: true,
    comments: {
      where: { approved: true },
      orderBy: { createdAt: 'desc' }
    }
  });

  if (!post) {
    return res.status(404).json({ error: 'Blog post not found' });
  }

  res.json(post);
}));

router.post('/blog', validateBlogPost, handleValidationErrors, asyncHandler(async (req, res) => {
  const post = await createRecord('blogPost', req.body);
  res.status(201).json(post);
}));

router.put('/blog/:id', commonValidations.id, validateBlogPost, handleValidationErrors, asyncHandler(async (req, res) => {
  const post = await updateRecord('blogPost', { id: parseInt(req.params.id) }, req.body);
  res.json(post);
}));

router.delete('/blog/:id', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  await deleteRecord('blogPost', { id: parseInt(req.params.id) });
  res.status(204).send();
}));

// Music Sets Routes
router.get('/sets', validatePagination, validateSearch, handleValidationErrors, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'releaseDate', order = 'desc', q, genre } = req.query;
  
  const where = {
    ...(genre && { genre }),
    ...(q && buildSearchQuery(q, ['title', 'description', 'genre', 'tags']))
  };

  const [sets, total] = await Promise.all([
    findRecords('musicSet', {
      where,
      include: { coverPhoto: true, tracks: true },
      orderBy: buildSortQuery(sort, order),
      ...paginate(parseInt(page), parseInt(limit))
    }),
    countRecords('musicSet', where)
  ]);

  res.json({
    data: sets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.get('/sets/:id', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  const set = await findRecord('musicSet', { id: parseInt(req.params.id) }, {
    coverPhoto: true,
    tracks: { orderBy: { position: 'asc' } }
  });

  if (!set) {
    return res.status(404).json({ error: 'Music set not found' });
  }

  res.json(set);
}));

router.post('/sets', validateMusicSet, handleValidationErrors, asyncHandler(async (req, res) => {
  const set = await createRecord('musicSet', req.body);
  res.status(201).json(set);
}));

router.put('/sets/:id', commonValidations.id, validateMusicSet, handleValidationErrors, asyncHandler(async (req, res) => {
  const set = await updateRecord('musicSet', { id: parseInt(req.params.id) }, req.body);
  res.json(set);
}));

router.delete('/sets/:id', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  await deleteRecord('musicSet', { id: parseInt(req.params.id) });
  res.status(204).send();
}));

// Tracks Routes
router.get('/sets/:setId/tracks', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  const tracks = await findRecords('track', {
    where: { setId: parseInt(req.params.setId) },
    orderBy: { position: 'asc' }
  });

  res.json(tracks);
}));

router.post('/sets/:setId/tracks', commonValidations.id, validateTrack, handleValidationErrors, asyncHandler(async (req, res) => {
  const trackData = { ...req.body, setId: parseInt(req.params.setId) };
  const track = await createRecord('track', trackData);
  res.status(201).json(track);
}));

router.put('/tracks/:id', commonValidations.id, validateTrack, handleValidationErrors, asyncHandler(async (req, res) => {
  const track = await updateRecord('track', { id: parseInt(req.params.id) }, req.body);
  res.json(track);
}));

router.delete('/tracks/:id', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  await deleteRecord('track', { id: parseInt(req.params.id) });
  res.status(204).send();
}));

// Testimonials Routes
router.get('/testimonials', validatePagination, validateSearch, handleValidationErrors, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', q, published } = req.query;
  
  const where = {
    ...(published !== undefined && { published: published === 'true' }),
    ...(q && buildSearchQuery(q, ['name', 'content', 'company']))
  };

  const [testimonials, total] = await Promise.all([
    findRecords('testimonial', {
      where,
      orderBy: buildSortQuery(sort, order),
      ...paginate(parseInt(page), parseInt(limit))
    }),
    countRecords('testimonial', where)
  ]);

  res.json({
    data: testimonials,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.get('/testimonials/:id', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  const testimonial = await findRecord('testimonial', { id: parseInt(req.params.id) });

  if (!testimonial) {
    return res.status(404).json({ error: 'Testimonial not found' });
  }

  res.json(testimonial);
}));

router.post('/testimonials', validateTestimonial, handleValidationErrors, asyncHandler(async (req, res) => {
  const testimonial = await createRecord('testimonial', req.body);
  res.status(201).json(testimonial);
}));

router.put('/testimonials/:id', commonValidations.id, validateTestimonial, handleValidationErrors, asyncHandler(async (req, res) => {
  const testimonial = await updateRecord('testimonial', { id: parseInt(req.params.id) }, req.body);
  res.json(testimonial);
}));

router.delete('/testimonials/:id', commonValidations.id, handleValidationErrors, asyncHandler(async (req, res) => {
  await deleteRecord('testimonial', { id: parseInt(req.params.id) });
  res.status(204).send();
}));

// Batch operations
router.post('/batch', asyncHandler(async (req, res) => {
  const { operations } = req.body;
  
  if (!Array.isArray(operations)) {
    return res.status(400).json({ error: 'Operations must be an array' });
  }

  const results = [];
  
  for (const operation of operations) {
    const { type, model, data, where } = operation;
    
    try {
      let result;
      switch (type) {
        case 'create':
          result = await createRecord(model, data);
          break;
        case 'update':
          result = await updateRecord(model, where, data);
          break;
        case 'delete':
          result = await deleteRecord(model, where);
          break;
        default:
          throw new Error(`Invalid operation type: ${type}`);
      }
      
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  res.json({ results });
}));

export default router;
