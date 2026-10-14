import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    tagline: { type: String, default: '' },
    description: { type: String, required: true },
    features: [{ type: String }],
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    billingInterval: { type: String, enum: ['ONE_TIME', 'MONTHLY', 'YEARLY'], default: 'ONE_TIME' },
    isFree: { type: Boolean, default: true },
    isExternal: { type: Boolean, default: false },
    externalUrl: { type: String },
    badge: { type: String },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE', index: true }
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', ProductSchema);
