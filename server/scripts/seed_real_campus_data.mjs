import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { CampusService } from '../models/CampusService.mjs';
import { Resource } from '../models/Resource.mjs';
import { Notification } from '../models/Notification.mjs';
import { Club } from '../models/Club.mjs';
import { User } from '../models/User.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REAL_CAMPUS_ROOMS = [
  // BLOCK 1 (CSE & IT Complex)
  {
    name: 'CSE-214',
    category: 'ROOM',
    block: 'Block 1 (CSE & IT)',
    building: 'Block 1',
    floor: '2nd Floor',
    seats: '24 seats',
    roomType: 'Lecture Hall',
    avail: 'Available for 90+ minutes',
    status: 'green',
    facilities: ['Air Conditioned', 'Smart Projector', 'Campus Wi-Fi', 'Whiteboard'],
    directions: 'Block 1, 2nd floor, turn right from Central Elevator. Beside Faculty Chamber 210.',
    contact: 'CSE Department Office: Ext 214'
  },
  {
    name: '1205-BL1-SF',
    category: 'ROOM',
    block: 'Block 1 (CSE & IT)',
    building: 'Block 1',
    floor: '1st Floor',
    seats: '42 seats',
    roomType: 'Smart Classroom',
    avail: 'Available until 12:30',
    status: 'green',
    facilities: ['Air Conditioned', 'Dual Digital Displays', 'Campus Wi-Fi', 'Audio System'],
    directions: 'Block 1, 1st floor, East Wing corridor.',
    contact: 'Academic Operations: Ext 105'
  },
  {
    name: 'AI & GPU Compute Lab 02',
    category: 'LAB',
    block: 'Block 1 (CSE & IT)',
    building: 'Block 1',
    floor: 'Ground Floor',
    seats: '36 seats',
    roomType: 'Computer Lab',
    avail: 'Available for 60+ minutes',
    status: 'green',
    facilities: ['Air Conditioned', 'NVIDIA Workstations', 'Gigabit Ethernet', 'Whiteboard'],
    directions: 'Block 1, Ground floor, entrance near North Quadrangle.',
    contact: 'Lab Administrator: Dr. Ramesh Babu A'
  },
  {
    name: 'CSE-308 Seminar Room',
    category: 'FACILITY',
    block: 'Block 1 (CSE & IT)',
    building: 'Block 1',
    floor: '3rd Floor',
    seats: '50 seats',
    roomType: 'Seminar Hall',
    avail: 'Available for 120 minutes',
    status: 'green',
    facilities: ['Air Conditioned', 'Dual Projector', 'Conference Mic Array', 'Ergonomic Seating'],
    directions: 'Block 1, 3rd floor, West end next to Dean Office.',
    contact: 'Seminar Coordinator: Ext 308'
  },

  // BLOCK 2 (ECE & EEE Wing)
  {
    name: 'ECE-104 Embedded Systems Lab',
    category: 'LAB',
    block: 'Block 2 (ECE & EEE)',
    building: 'Block 2',
    floor: '1st Floor',
    seats: '30 seats',
    roomType: 'Hardware Lab',
    avail: 'Available for 60 minutes',
    status: 'orange',
    facilities: ['Oscilloscopes', 'Microcontroller Test Benches', 'Soldering Stations', 'Wi-Fi'],
    directions: 'Block 2, 1st floor, opposite Electronics Department Library.',
    contact: 'ECE Lab In-Charge: Ext 104'
  },
  {
    name: 'Seminar Hall 02',
    category: 'FACILITY',
    block: 'Block 2 (ECE & EEE)',
    building: 'Block 2',
    floor: '3rd Floor',
    seats: '60 seats',
    roomType: 'Seminar Hall',
    avail: 'Available for 90+ minutes',
    status: 'green',
    facilities: ['Air Conditioned', 'PA Sound System', 'Stage Podium', 'Wi-Fi'],
    directions: 'Block 2, 3rd floor Central Foyer.',
    contact: 'Block 2 Admin Desk: Ext 200'
  },
  {
    name: 'EEE-202 Tutorial Room',
    category: 'ROOM',
    block: 'Block 2 (ECE & EEE)',
    building: 'Block 2',
    floor: '2nd Floor',
    seats: '22 seats',
    roomType: 'Classroom',
    avail: 'Available for 90+ minutes',
    status: 'green',
    facilities: ['Whiteboard', 'Ceiling Fans', 'Campus Wi-Fi', 'Power Outlets'],
    directions: 'Block 2, 2nd floor, South Wing corridor.',
    contact: 'Electrical Dept Office: Ext 202'
  },

  // BLOCK 3 (Science & Humanities)
  {
    name: 'Physics Optics Lab 101',
    category: 'LAB',
    block: 'Block 3 (Sciences)',
    building: 'Block 3',
    floor: '1st Floor',
    seats: '30 seats',
    roomType: 'Science Lab',
    avail: 'Available until 15:00',
    status: 'orange',
    facilities: ['Dark Room Benches', 'Spectrometers', 'Laser Mounts', 'Wi-Fi'],
    directions: 'Block 3, 1st floor, adjacent to Applied Physics Department.',
    contact: 'Physics Lab Desk: Ext 311'
  },
  {
    name: 'Lecture Theatre 301',
    category: 'ROOM',
    block: 'Block 3 (Sciences)',
    building: 'Block 3',
    floor: '3rd Floor',
    seats: '80 seats',
    roomType: 'Lecture Hall',
    avail: 'Available for 120+ minutes',
    status: 'green',
    facilities: ['Air Conditioned', 'Tiered Amphitheatre Seating', 'Wireless Mic', 'Smart Board'],
    directions: 'Block 3, 3rd floor Central Auditorium entrance.',
    contact: 'Dean of Sciences: Ext 301'
  },

  // CENTRAL LIBRARY (Knowledge Hub)
  {
    name: 'Silent Study Pod 03',
    category: 'ROOM',
    block: 'Central Library',
    building: 'Central Library',
    floor: 'Ground Floor',
    seats: '4 seats',
    roomType: 'Study Pod',
    avail: 'Available for 90+ minutes',
    status: 'green',
    facilities: ['Soundproof Enclosure', 'Power Outlets', 'Individual Desk Lamps', 'Wi-Fi'],
    directions: 'Central Library, Ground Floor, Quiet Study Wing.',
    contact: 'Library Help Desk: Ext 001'
  },
  {
    name: 'Library Pod 06',
    category: 'ROOM',
    block: 'Central Library',
    building: 'Central Library',
    floor: '1st Floor',
    seats: '6 seats',
    roomType: 'Study Pod',
    avail: 'Available for 90+ minutes',
    status: 'green',
    facilities: ['Whiteboard', 'Dedicated Wi-Fi Access Point', 'Ergonomic Chairs'],
    directions: 'Central Library, 1st floor North Mezzanine.',
    contact: 'Library Desk: Ext 002'
  },
  {
    name: 'Digital Research Vault 2A',
    category: 'FACILITY',
    block: 'Central Library',
    building: 'Central Library',
    floor: '2nd Floor',
    seats: '14 seats',
    roomType: 'Digital Lab',
    avail: 'Available for 60 minutes',
    status: 'green',
    facilities: ['Air Conditioned', 'IEEE & Springer Terminals', 'High-Speed LAN', 'Laser Printer'],
    directions: 'Central Library, 2nd floor, Electronic Resource Centre.',
    contact: 'Digital Librarian: Ext 004'
  },

  // DESIGN STUDIO & SAC
  {
    name: 'Design Lab 03',
    category: 'LAB',
    block: 'Design Studio & SAC',
    building: 'Design Wing',
    floor: 'Ground Floor',
    seats: '24 seats',
    roomType: 'Design Studio',
    avail: 'Available until 16:10',
    status: 'orange',
    facilities: ['Drafting Tables', 'Color Calibrated Displays', 'Campus Wi-Fi', 'Air Conditioned'],
    directions: 'Student Activity Centre (SAC), Ground Floor, Design Wing.',
    contact: 'Design Studio Lead: Ext 403'
  },
  {
    name: 'Makerspace Prototyping Lab',
    category: 'LAB',
    block: 'Design Studio & SAC',
    building: 'SAC Innovation Hub',
    floor: '1st Floor',
    seats: '18 seats',
    roomType: 'Makerspace',
    avail: 'Available for 90+ minutes',
    status: 'green',
    facilities: ['3D Printers', 'Laser Cutters', 'Electronics Workbench', 'Safety Vents'],
    directions: 'SAC Innovation Hub, 1st floor Central Lab.',
    contact: 'Makerspace Coordinator: Ext 410'
  },

  // MECHANICAL & ROBOTICS BLOCK
  {
    name: 'Robotics Automation Cell 01',
    category: 'LAB',
    block: 'Mechanical & Robotics Block',
    building: 'Mechanical Block',
    floor: 'Ground Floor',
    seats: '20 seats',
    roomType: 'Robotics Lab',
    avail: 'Available for 90+ minutes',
    status: 'green',
    facilities: ['Robotic Arms', 'PLC Training Rigs', 'Sensor Benches', 'Campus Wi-Fi'],
    directions: 'Mechanical Block, Ground floor North Workshop bay.',
    contact: 'Robotics Lab Lead: Ext 501'
  },
  {
    name: 'CAD / CAM Simulation Lab 102',
    category: 'LAB',
    block: 'Mechanical & Robotics Block',
    building: 'Mechanical Block',
    floor: '1st Floor',
    seats: '32 seats',
    roomType: 'Computer Lab',
    avail: 'Available until 16:45',
    status: 'green',
    facilities: ['Air Conditioned', 'SolidWorks / ANSYS Workstations', 'Dual Monitors', 'Wi-Fi'],
    directions: 'Mechanical Block, 1st floor West Wing.',
    contact: 'CAD Lab In-Charge: Ext 502'
  }
];

const REAL_STUDY_RESOURCES = [
  {
    title: 'Mid-term 1 Question Paper — Machine Learning & Neural Networks',
    subject: 'Machine Learning',
    category: 'Mid-term Exam Paper',
    format: 'PDF',
    fileType: 'document',
    fileName: 'ML_Midterm_1_Paper_2025.pdf',
    fileSize: '1.2 MB',
    authorName: 'Dr. Ramesh Babu A',
    authorDept: 'Computer Science',
    isVerified: true,
    downloadsCount: 84
  },
  {
    title: 'Operating Systems — Mid-term Question Paper & Detailed Solutions',
    subject: 'Operating Systems',
    category: 'Mid-term Exam Paper',
    format: 'PDF',
    fileType: 'document',
    fileName: 'OS_Midterm_Paper_Solutions.pdf',
    fileSize: '1.8 MB',
    authorName: 'Prof. Ananya Sen',
    authorDept: 'Computer Science',
    isVerified: true,
    downloadsCount: 112
  },
  {
    title: 'Advanced Database Systems — Mid-term Question Bank (2023–2025)',
    subject: 'Database Systems',
    category: 'Mid-term Exam Paper',
    format: 'PDF',
    fileType: 'document',
    fileName: 'DBMS_Midterm_Question_Bank.pdf',
    fileSize: '2.1 MB',
    authorName: 'Prof. S. N. Murthy',
    authorDept: 'Computer Science',
    isVerified: true,
    downloadsCount: 65
  },
  {
    title: 'Computer Networks — Mid-term Lab Walkthrough & Packet Traces',
    subject: 'Computer Networks',
    category: 'Lab Manual',
    format: 'PDF',
    fileType: 'document',
    fileName: 'Networks_Lab_Manual_Wireshark.pdf',
    fileSize: '3.4 MB',
    authorName: 'Prof. Ananya Sen',
    authorDept: 'Computer Science',
    isVerified: true,
    downloadsCount: 47
  },
  {
    title: 'Compiler Design — Handwritten Cheatsheet & Grammar Derivations',
    subject: 'Compiler Design',
    category: 'Photo / Handwritten',
    format: 'Photo',
    fileType: 'photo',
    fileName: 'Compiler_Grammar_Handwritten.jpg',
    fileSize: '950 KB',
    authorName: 'Academic Library Vault',
    authorDept: 'Computer Science',
    isVerified: true,
    downloadsCount: 53
  }
];

async function seedRealData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[Migration] Connected to MongoDB Atlas.');

  // 1. Update Campus Rooms
  await CampusService.deleteMany({});
  await CampusService.insertMany(REAL_CAMPUS_ROOMS);
  console.log(`[Migration] Populated ${REAL_CAMPUS_ROOMS.length} verified campus rooms across all blocks.`);

  // 2. Update Study Resources with real mid-term exam papers
  await Resource.deleteMany({});
  await Resource.insertMany(REAL_STUDY_RESOURCES);
  console.log(`[Migration] Populated ${REAL_STUDY_RESOURCES.length} verified academic resources and mid-term papers.`);

  // 3. Remove fake demo notifications
  await Notification.deleteMany({
    title: { $in: [
      'Nisha Raman requested to join Quiet Hours',
      'New Event: Human-centred AI workshop',
      'Mid-Semester Timetable Verified'
    ]}
  });
  console.log('[Migration] Cleaned up fake notifications.');

  await mongoose.disconnect();
  console.log('[Migration] Finished successfully.');
}

seedRealData().catch((err) => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
