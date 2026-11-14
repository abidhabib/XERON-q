import express from 'express';
import mysql from 'mysql2';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import con from '../config/db.js';
import { createProductTaskSchemaInitializer } from '../services/productTaskSchema.js';
import { createProductTaskService, httpLink } from '../services/productTasks.js';

export default function productTaskRoutes(verifyAdmin) {
  const router = express.Router();
  const pool = mysql.createPool({
    host: con.config.host, port: con.config.port, user: con.config.user,
    password: con.config.password, database: con.config.database, connectionLimit: 5,
  }).promise();
  const ensureSchema = createProductTaskSchemaInitializer(pool);
  ensureSchema().catch(error => console.error('Product-sharing schema setup failed:', error.code || error.message));
  const schemaReady = async (req, res, next) => {
    try { await ensureSchema(); next(); }
    catch (error) {
      console.error('Product-sharing schema setup failed:', error.code || error.message);
      const message = 'Tasks are temporarily unavailable. Please try again shortly.';
      res.status(503).json({ status: 'error', success: false, error: message, message });
    }
  };
  const tasks = createProductTaskService(pool);
  const uploadDir = fileURLToPath(new URL('../uploads/products/', import.meta.url));
  const imageTypes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, callback) {
        fs.mkdir(uploadDir, { recursive: true }, error => callback(error, uploadDir));
      },
      filename(req, file, callback) {
        callback(null, `product-${Date.now()}-${Math.random().toString(36).slice(2)}${imageTypes[file.mimetype]}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter(req, file, callback) {
      if (!imageTypes[file.mimetype]) return callback(new Error('Use a JPG, PNG or WebP photo'));
      callback(null, true);
    },
  }).single('photo');
  const receivePhoto = (req, res, next) => upload(req, res, error => {
    if (error) return res.status(400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 5 MB or smaller' : error.message });
    next();
  });
  const cleanUpload = async req => { if (req.file) await fs.promises.unlink(req.file.path).catch(() => {}); };
  const fail = (res, error) => {
    if (!error.status) console.error('Product task error:', error);
    res.status(error.status || 500).json({ status: 'error', success: false, error: error.status ? error.message : 'Unable to process product tasks', message: error.status ? error.message : 'Unable to process product tasks' });
  };
  const authenticated = (req, res, next) => req.session?.userId ? next() : res.status(401).json({ status: 'error', error: 'Please sign in to continue' });

  router.get('/fetchClickedProducts', authenticated, schemaReady, async (req, res) => {
    try { res.json(await tasks(req.session.userId)); } catch (error) { fail(res, error); }
  });
  router.post('/updateBalance', authenticated, schemaReady, async (req, res) => {
    const productId = Number(req.body.productId);
    if (!Number.isSafeInteger(productId) || productId <= 0) return res.status(400).json({ status: 'error', error: 'A valid productId is required' });
    try { res.json(await tasks(req.session.userId, productId)); } catch (error) { fail(res, error); }
  });
  router.get('/products', verifyAdmin, schemaReady, async (req, res) => {
    try {
      const [products] = await pool.query('SELECT id, description, link, imgLink, active, created_at FROM products ORDER BY id DESC');
      res.json({ success: true, data: products });
    } catch (error) { fail(res, error); }
  });
  const saveProduct = editing => async (req, res) => {
    const description = String(req.body.description || '').trim();
    const link = httpLink(req.body.link);
    if (!description || description.length > 255 || !link) {
      await cleanUpload(req);
      return res.status(400).json({ success: false, message: 'Enter a description (up to 255 characters) and a valid HTTP or HTTPS product link' });
    }
    const id = Number(req.params.id);
    if (editing && (!Number.isSafeInteger(id) || id <= 0)) {
      await cleanUpload(req); return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    try {
      let current;
      if (editing) {
        const [[product]] = await pool.query('SELECT id, imgLink FROM products WHERE id = ?', [id]);
        current = product;
        if (!current) { await cleanUpload(req); return res.status(404).json({ success: false, message: 'Product not found' }); }
      }
      const imgLink = req.file ? `/uploads/products/${path.basename(req.file.filename)}` : current?.imgLink;
      if (!imgLink) { await cleanUpload(req); return res.status(400).json({ success: false, message: 'Upload a product photo' }); }
      const active = req.body.active === '0' || req.body.active === 0 ? 0 : 1;
      if (editing) {
        await pool.query('UPDATE products SET description = ?, link = ?, imgLink = ?, active = ? WHERE id = ?', [description, link, imgLink, active, id]);
      } else {
        await pool.query('INSERT INTO products (description, link, imgLink, active) VALUES (?, ?, ?, ?)', [description, link, imgLink, active]);
      }
      res.status(editing ? 200 : 201).json({ success: true, message: editing ? 'Product updated' : 'Product added' });
    } catch (error) { await cleanUpload(req); fail(res, error); }
  };
  router.post('/products', verifyAdmin, schemaReady, receivePhoto, saveProduct(false));
  router.put('/products/:id', verifyAdmin, schemaReady, receivePhoto, saveProduct(true));
  router.delete('/products/:id', verifyAdmin, schemaReady, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid product ID' });
    try {
      const [result] = await pool.query('UPDATE products SET active = 0 WHERE id = ?', [id]);
      if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, message: 'Product disabled' });
    } catch (error) { fail(res, error); }
  });
  return router;
}
