import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;

async function auditData() {
  console.log('--- MONGODB ATLAS COLLECTION AUDIT ---');
  await mongoose.connect(uri);
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  const report = {};
  for (const c of collections) {
    const coll = mongoose.connection.db.collection(c.name);
    const count = await coll.countDocuments();
    const docs = await coll.find({}).limit(5).toArray();
    report[c.name] = { count, sample: docs.map(d => ({ _id: d._id, name: d.name || d.title || d.email || d.orderId })) };
  }
  
  console.log(JSON.stringify(report, null, 2));

  // Check for potential duplicate users by email
  const userColl = mongoose.connection.db.collection('users');
  const userDups = await userColl.aggregate([
    { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log('Duplicate users by email:', userDups);

  // Check for potential duplicate clubs by slug or name
  const clubColl = mongoose.connection.db.collection('clubs');
  const clubDups = await clubColl.aggregate([
    { $group: { _id: { $toLower: '$name' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log('Duplicate clubs by name:', clubDups);

  // Check for potential duplicate events by title
  const eventColl = mongoose.connection.db.collection('events');
  const eventDups = await eventColl.aggregate([
    { $group: { _id: { $toLower: '$title' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log('Duplicate events by title:', eventDups);

  // Check for potential duplicate announcements by title
  const annColl = mongoose.connection.db.collection('announcements');
  const annDups = await annColl.aggregate([
    { $group: { _id: { $toLower: '$title' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log('Duplicate announcements by title:', annDups);

  // Check for duplicate products by slug
  const prodColl = mongoose.connection.db.collection('products');
  const prodDups = await prodColl.aggregate([
    { $group: { _id: '$slug', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log('Duplicate products by slug:', prodDups);

  await mongoose.disconnect();
}

auditData().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
