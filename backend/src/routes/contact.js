import express from 'express';
import nodemailer from 'nodemailer';
import mysql from 'mysql2/promise';
import { body, validationResult } from 'express-validator';
import { sanitizeInput } from '../middleware/security.js';

const router = express.Router();

// MySQL connection configuration
const dbConfig = {
  host: '192.168.1.40',
  port: 3306,
  user: 'admin',
  password: 'admin123',
  database: 'josepe_DB'
};

// Validaciones para mensajes de contacto
const validateContactMessage = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .escape(),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  body('phone')
    .optional()
    .isMobilePhone(['es-ES', 'en-US'])
    .withMessage('Número de teléfono inválido'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('El asunto no puede exceder 200 caracteres')
    .escape(),

  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('El mensaje debe tener entre 10 y 2000 caracteres')
    .escape(),

  body('type')
    .optional()
    .isIn(['general', 'booking', 'collaboration', 'technical', 'other'])
    .withMessage('Tipo de mensaje inválido'),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre de la empresa no puede exceder 100 caracteres')
    .escape()
];

// ✅ CORRECCIÓN LÍNEA 25: createTransporter → createTransport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
};

// POST /api/contact - Enviar mensaje de contacto
router.post('/', validateContactMessage, async (req, res) => {
  try {
    console.log('📧 Nuevo mensaje de contacto recibido:', {
      name: req.body.name,
      email: req.body.email,
      type: req.body.type || 'general',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const {
      name,
      email,
      phone,
      company,
      subject,
      message,
      type = 'general'
    } = req.body;

    // Sanitizar entrada adicional
    const sanitizedMessage = sanitizeInput(message);
    const sanitizedName = sanitizeInput(name);

    // Guardar mensaje en la base de datos
    const connection = await mysql.createConnection(dbConfig);
    try {
      const query = `
        INSERT INTO ContactMessage 
        (name, email, phone, company, subject, message, type, status, priority, read, ip, userAgent, source, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const values = [
        sanitizedName,
        email.toLowerCase(),
        phone || null,
        company || null,
        subject || `Mensaje de ${sanitizedName}`,
        sanitizedMessage,
        type,
        'new',
        'normal',
        false,
        req.ip,
        req.get('User-Agent'),
        'website'
      ];

      const [result] = await connection.execute(query, values);

      // Obtener el mensaje creado
      const [rows] = await connection.execute('SELECT * FROM ContactMessage WHERE id = ?', [result.insertId]);
      const contactMessage = rows[0];
    } finally {
      await connection.end();
    }

    // Enviar email de notificación
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || 'admin@djjosep.com',
        subject: `[DJ Josep Website] Nuevo mensaje: ${subject || 'Sin asunto'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              Nuevo Mensaje de Contacto
            </h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">Información del Contacto</h3>
              <p><strong>Nombre:</strong> ${sanitizedName}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
              ${company ? `<p><strong>Empresa:</strong> ${company}</p>` : ''}
              <p><strong>Tipo:</strong> ${type}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="background: #fff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Mensaje</h3>
              <p style="line-height: 1.6; white-space: pre-line;">${sanitizedMessage}</p>
            </div>

            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; font-size: 12px; color: #6c757d;">
              <p><strong>Información Técnica:</strong></p>
              <p>IP: ${req.ip}</p>
              <p>User-Agent: ${req.get('User-Agent')}</p>
              <p>ID del mensaje: ${contactMessage.id}</p>
            </div>
          </div>
        `,
        text: `
Nuevo mensaje de contacto

Nombre: ${sanitizedName}
Email: ${email}
${phone ? `Teléfono: ${phone}\n` : ''}
${company ? `Empresa: ${company}\n` : ''}
Tipo: ${type}
Fecha: ${new Date().toLocaleString()}

Mensaje:
${sanitizedMessage}

---
ID del mensaje: ${contactMessage.id}
IP: ${req.ip}
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email de notificación enviado correctamente');

    } catch (emailError) {
      console.error('❌ Error enviando email de notificación:', emailError);
      // No fallar la request si el email falla, pero loggear el error
    }

    // Respuesta exitosa
    res.status(201).json({
      message: 'Mensaje de contacto enviado exitosamente',
      id: contactMessage.id,
      status: 'sent',
      timestamp: contactMessage.createdAt
    });

    console.log('✅ Mensaje de contacto procesado exitosamente:', {
      id: contactMessage.id,
      name: sanitizedName,
      email: email
    });

  } catch (error) {
    console.error('❌ Error procesando mensaje de contacto:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo procesar el mensaje de contacto'
    });
  }
});

// GET /api/contact - Obtener mensajes de contacto (para admin)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';
    const type = req.query.type || 'all';
    const sort = req.query.sort || 'newest';

    // Construir consulta MySQL
    const connection = await mysql.createConnection(dbConfig);
    try {
      let query = `
        SELECT id, name, email, phone, company, subject, message, type, priority, status, read, notes, createdAt, repliedAt, source
        FROM ContactMessage
      `;

      const values = [];
      const conditions = [];

      if (status !== 'all') {
        conditions.push('status = ?');
        values.push(status);
      }
      if (type !== 'all') {
        conditions.push('type = ?');
        values.push(type);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Ordenamiento
      let orderClause = 'createdAt DESC';
      switch (sort) {
        case 'oldest':
          orderClause = 'createdAt ASC';
          break;
        case 'priority':
          orderClause = 'priority DESC, createdAt DESC';
          break;
        case 'newest':
        default:
          orderClause = 'createdAt DESC';
      }
      query += ` ORDER BY ${orderClause} LIMIT ${limit} OFFSET ${offset}`;

      const [messages] = await connection.execute(query, values);

      // Obtener el conteo total
      let countQuery = 'SELECT COUNT(*) as total FROM ContactMessage';
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }
      const [countResult] = await connection.execute(countQuery, values);
      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        messages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        },
        filters: {
          status,
          type,
          sort
        }
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Error obteniendo mensajes de contacto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/contact/:id - Actualizar estado de mensaje
router.put('/:id', async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const { status, priority, notes, read } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (read !== undefined) updateData.read = read;
    if (status === 'replied') updateData.repliedAt = new Date();

    // Construir consulta UPDATE dinámica
    const connection = await mysql.createConnection(dbConfig);
    try {
      const setParts = [];
      const values = [];

      if (updateData.status) {
        setParts.push('status = ?');
        values.push(updateData.status);
      }
      if (updateData.priority) {
        setParts.push('priority = ?');
        values.push(updateData.priority);
      }
      if (updateData.notes !== undefined) {
        setParts.push('notes = ?');
        values.push(updateData.notes);
      }
      if (updateData.read !== undefined) {
        setParts.push('read = ?');
        values.push(updateData.read);
      }
      if (updateData.repliedAt) {
        setParts.push('repliedAt = ?');
        values.push(updateData.repliedAt);
      }

      setParts.push('updatedAt = NOW()');

      const query = `UPDATE ContactMessage SET ${setParts.join(', ')} WHERE id = ?`;
      values.push(messageId);

      const [result] = await connection.execute(query, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: 'Mensaje no encontrado'
        });
      }

      // Obtener el mensaje actualizado
      const [rows] = await connection.execute('SELECT * FROM ContactMessage WHERE id = ?', [messageId]);
      const updatedMessage = rows[0];

      res.json({
        message: 'Mensaje actualizado exitosamente',
        data: updatedMessage
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ Error actualizando mensaje:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Mensaje no encontrado'
      });
    }
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/contact/:id - Eliminar mensaje
router.delete('/:id', async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);

    // Eliminar mensaje usando MySQL
    const connection = await mysql.createConnection(dbConfig);
    try {
      const query = 'DELETE FROM ContactMessage WHERE id = ?';
      const [result] = await connection.execute(query, [messageId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: 'Mensaje no encontrado'
        });
      }

      res.json({
        message: 'Mensaje eliminado exitosamente'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ Error eliminando mensaje:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Mensaje no encontrado'
      });
    }
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

export default router;
