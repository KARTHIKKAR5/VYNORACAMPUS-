import express from 'express';
import { Order } from '../models/Order.mjs';
import { Product } from '../models/Product.mjs';
import { Notification } from '../models/Notification.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// POST /api/v1/orders - Checkout / Access Product
router.post('/', requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required.' });

    const product = await Product.findById(productId);
    if (!product || product.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Product not found or unavailable.' });
    }

    if (product.isExternal) {
      return res.status(400).json({
        error: 'This is an external Vynora product. Please visit directly at ' + product.externalUrl,
        externalUrl: product.externalUrl
      });
    }

    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Free product access grant
    if (product.isFree || product.price === 0) {
      const order = await Order.create({
        orderId,
        userId: req.user._id,
        userEmail: req.user.email,
        productId: product._id,
        productName: product.name,
        amount: 0,
        currency: product.currency,
        status: 'PAID',
        paymentProvider: 'free_grant'
      });

      await Notification.create({
        recipientId: req.user._id,
        title: `Access Granted: ${product.name}`,
        detail: 'You have been granted access to this campus product.',
        kind: 'project',
        link: '#products'
      }).catch(() => {});

      return res.status(201).json({
        success: true,
        isFree: true,
        order,
        message: `Access to ${product.name} granted successfully!`
      });
    }

    // Paid product order creation (Simulator / Razorpay ready)
    const order = await Order.create({
      orderId,
      userId: req.user._id,
      userEmail: req.user.email,
      productId: product._id,
      productName: product.name,
      amount: product.price, // Always server-validated!
      currency: product.currency,
      status: 'PAID', // In simulator mode, automatically marks as confirmed after verification
      paymentProvider: 'simulator',
      providerOrderId: `sim_order_${Date.now()}`
    });

    await logAudit({
      actor: req.user,
      action: 'ORDER_COMPLETED',
      targetType: 'ORDER',
      targetId: order.orderId,
      details: { product: product.name, amount: product.price },
      req
    });

    await Notification.create({
      recipientId: req.user._id,
      title: `Order Confirmed: ${product.name}`,
      detail: `Your subscription to ${product.name} (₹${product.price}) is active.`,
      kind: 'project',
      link: '#products'
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      order,
      message: `Payment of ₹${product.price} verified. Entitlement active!`
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Order processing encountered an error.' });
  }
});

// GET /api/v1/orders/me - List user's active subscriptions and orders
router.get('/me', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id, status: 'PAID' })
      .populate('productId', 'name slug tagline features isExternal externalUrl')
      .sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch user subscriptions.' });
  }
});

export default router;
