import express from 'express';
import { Product } from '../models/Product.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { requireRole } from '../middleware/rbac.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// GET /api/v1/products - Public product catalog
router.get('/', authenticate, async (req, res) => {
  try {
    const products = await Product.find({ status: 'ACTIVE' }).sort({ isExternal: -1, price: 1 });
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch products catalog.' });
  }
});

// GET /api/v1/products/:slug
router.get('/:slug', authenticate, async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'ACTIVE' });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    return res.json({ product });
  } catch (error) {
    return res.status(404).json({ error: 'Product not found.' });
  }
});

// POST /api/v1/products - Admin create product
router.post('/', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, tagline, description, features, price, currency, billingInterval, isFree, isExternal, externalUrl, badge } = req.body;
    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Product name and description are required.' });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = await Product.create({
      name: name.trim(),
      slug,
      tagline: tagline || '',
      description: description.trim(),
      features: Array.isArray(features) ? features : [],
      price: Number(price) || 0,
      currency: currency || 'INR',
      billingInterval: billingInterval || 'ONE_TIME',
      isFree: Boolean(isFree),
      isExternal: Boolean(isExternal),
      externalUrl: externalUrl || '',
      badge: badge || '',
      status: 'ACTIVE'
    });

    await logAudit({
      actor: req.user,
      action: 'PRODUCT_CREATED',
      targetType: 'PRODUCT',
      targetId: product._id,
      details: { name: product.name, slug: product.slug, price: product.price },
      req
    });

    return res.status(201).json({ product });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create product.' });
  }
});

// PATCH /api/v1/products/:id - Admin update product
router.patch('/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const updates = req.body;
    Object.assign(product, updates);
    await product.save();

    await logAudit({
      actor: req.user,
      action: 'PRODUCT_UPDATED',
      targetType: 'PRODUCT',
      targetId: product._id,
      details: { updates },
      req
    });

    return res.json({ product });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update product.' });
  }
});

export default router;
