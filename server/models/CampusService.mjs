import mongoose from 'mongoose';

const CampusServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['ROOM', 'LAB', 'FACILITY', 'SUPPORT', 'EMERGENCY'], default: 'ROOM', index: true },
    block: { type: String, default: 'Block 1', index: true },
    building: { type: String, default: 'Block 1' },
    floor: { type: String, default: '2nd Floor' },
    seats: { type: String, default: '24 seats' },
    roomType: { type: String, default: 'Lecture Hall' },
    avail: { type: String, default: 'Available for 90+ minutes' },
    status: { type: String, enum: ['green', 'orange', 'red'], default: 'green' },
    facilities: [{ type: String }],
    contact: { type: String, default: 'Academic Operations Desk' },
    directions: { type: String }
  },
  { timestamps: true }
);

export const CampusService = mongoose.model('CampusService', CampusServiceSchema);
