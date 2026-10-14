import express from 'express';
import { CampusService } from '../models/CampusService.mjs';
import { authenticate } from '../middleware/auth.mjs';

const router = express.Router();

const CAMPUS_BLOCKS = [
  'Block 1 (CSE & IT Complex)',
  'Block 2 (ECE & EEE Wing)',
  'Block 3 (Science & Humanities)',
  'Central Library (Knowledge Hub)',
  'Design Studio & SAC',
  'Mechanical & Robotics Block'
];

// GET /api/v1/campus-services
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, block, building, q } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;

    if (block && block !== 'All') {
      filter.$or = [
        { block: new RegExp(block, 'i') },
        { building: new RegExp(block, 'i') }
      ];
    } else if (building && building !== 'All') {
      filter.$or = [
        { block: new RegExp(building, 'i') },
        { building: new RegExp(building, 'i') }
      ];
    }

    if (q) {
      const qRegex = new RegExp(q, 'i');
      const textFilter = [
        { name: qRegex },
        { block: qRegex },
        { building: qRegex },
        { roomType: qRegex },
        { floor: qRegex },
        { facilities: qRegex }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: textFilter }];
        delete filter.$or;
      } else {
        filter.$or = textFilter;
      }
    }

    const services = await CampusService.find(filter).sort({ block: 1, name: 1 });
    return res.json({ services, blocks: CAMPUS_BLOCKS });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch campus services.' });
  }
});

// GET /api/v1/campus-services/blocks
router.get('/blocks', authenticate, (req, res) => {
  return res.json({ blocks: CAMPUS_BLOCKS });
});

export default router;
