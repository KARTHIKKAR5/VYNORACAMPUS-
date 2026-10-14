import express from 'express';
import { Timetable } from '../models/Timetable.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { requireRole } from '../middleware/rbac.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

const nowKolkata = () => new Date();
const getDayName = (date = nowKolkata()) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(date);
const getTimeKolkata = (date = nowKolkata()) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(date);

function getClassStatus(entries, date = nowKolkata()) {
  const currentDay = getDayName(date);
  const currentTime = getTimeKolkata(date);
  const todayClasses = entries.filter((e) => e.day === currentDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const ongoing = todayClasses.find((e) => e.startTime <= currentTime && (!e.endTime || e.endTime > currentTime));
  if (ongoing) return { status: 'ongoing', class: ongoing, today: todayClasses };

  const next = todayClasses.find((e) => e.startTime > currentTime);
  if (next) return { status: todayClasses.length ? 'upcoming' : 'no_classes', class: next, today: todayClasses };

  return { status: todayClasses.length ? 'finished' : 'no_classes', class: null, today: todayClasses };
}

// In-memory cache for srux.in timetable options tree
let cachedSruxOptions = null;
let lastSruxFetch = 0;

async function getSruxOptions() {
  if (cachedSruxOptions && Date.now() - lastSruxFetch < 3600000) {
    return cachedSruxOptions;
  }
  try {
    const res = await fetch('https://www.srux.in/timetable_options.json');
    if (res.ok) {
      cachedSruxOptions = await res.json();
      lastSruxFetch = Date.now();
      return cachedSruxOptions;
    }
  } catch (err) {
    console.warn('[SRUX] Error fetching live timetable options:', err.message);
  }
  return cachedSruxOptions || {};
}

// Fetch live timetable for any batch from srux.in and persist to MongoDB
async function getTimetableForBatch(batchCode) {
  if (!batchCode) return null;
  const cleanCode = String(batchCode).trim();

  // 1. Check existing in MongoDB
  let doc = await Timetable.findOne({ sruBatchCode: cleanCode });

  // If already in DB and updated within last 12 hours, return cached
  if (doc && doc.entries && doc.entries.length > 0 && doc.lastUpdated && Date.now() - new Date(doc.lastUpdated).getTime() < 43200000) {
    return doc;
  }

  // 2. Fetch live directly from srux.in
  try {
    const res = await fetch(`https://www.srux.in/timetables/${encodeURIComponent(cleanCode)}.json`);
    if (res.ok) {
      const raw = await res.json();
      const entries = [];
      const timetableMap = raw.timetable || {};

      for (const [day, slots] of Object.entries(timetableMap)) {
        if (!Array.isArray(slots)) continue;
        for (const slot of slots) {
          const startTime = slot.time;
          if (!startTime || !Array.isArray(slot.subjects)) continue;

          for (const item of slot.subjects) {
            if (typeof item !== 'object' || !item.subject) continue; // Skip "Free Slot" strings

            // Calculate 50-minute lecture/lab window
            const [h, m] = startTime.split(':').map(Number);
            const endMinutes = (h || 0) * 60 + (m || 0) + 50;
            const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
            const endM = String(endMinutes % 60).padStart(2, '0');
            const endTime = `${endH}:${endM}`;

            entries.push({
              id: item.unique_id || `${day}_${startTime}_${item.id || Math.random().toString(36).substring(7)}`,
              day,
              startTime,
              endTime,
              subject: item.subject,
              room: item.room_name || item.room || 'Classroom',
              faculty: item.facultyName || (typeof item.faculty === 'string' ? item.faculty : '') || 'Faculty',
              type: item.ltp || 'Lecture',
              courseCode: item.coursecode || ''
            });
          }
        }
      }

      doc = await Timetable.findOneAndUpdate(
        { sruBatchCode: cleanCode },
        {
          degree: raw.degree || 'SR University',
          program: raw.degree || 'Engineering',
          year: raw.year || 'Academic Year',
          batch: cleanCode,
          sruBatchCode: cleanCode,
          entries,
          lastUpdated: new Date(),
          source: 'https://www.srux.in/timetable'
        },
        { upsert: true, new: true }
      );
      return doc;
    }
  } catch (err) {
    console.warn(`[SRUX] Unable to fetch live timetable for batch ${cleanCode}:`, err.message);
  }

  return doc;
}

// GET /api/v1/timetable/options - Live degree, year, and batch options from srux.in
router.get('/options', async (req, res) => {
  try {
    const sruxData = await getSruxOptions();
    const flatOptions = [];

    for (const [degree, yearsMap] of Object.entries(sruxData)) {
      for (const [year, batches] of Object.entries(yearsMap)) {
        if (Array.isArray(batches)) {
          for (const batch of batches) {
            flatOptions.push({
              degree,
              program: degree,
              year,
              batch,
              sruBatchCode: batch
            });
          }
        }
      }
    }

    return res.json({
      options: flatOptions,
      tree: sruxData
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load timetable options from srux.in.' });
  }
});

// GET /api/v1/timetable/week
router.get('/week', authenticate, async (req, res) => {
  try {
    const batchCode = req.query.batch || req.user?.academicProfile?.sruBatchCode || req.user?.academicProfile?.batchCode || req.user?.academicProfile?.batch || '24BTCAIAIB10';
    let timetable = await getTimetableForBatch(batchCode);

    if (!timetable) {
      timetable = await Timetable.findOne({ sruBatchCode: '24BTCAIAIB10' }) || await Timetable.findOne();
    }

    if (!timetable) {
      return res.status(404).json({ error: `Timetable not found for batch ${batchCode}.` });
    }

    return res.json({
      status: 'fresh',
      sruBatchCode: timetable.sruBatchCode,
      degree: timetable.degree,
      program: timetable.program,
      year: timetable.year,
      batch: timetable.batch,
      entries: timetable.entries,
      lastUpdated: timetable.lastUpdated,
      source: timetable.source || 'https://www.srux.in/timetable'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load weekly timetable.' });
  }
});

// GET /api/v1/timetable/today
router.get('/today', authenticate, async (req, res) => {
  try {
    const batchCode = req.query.batch || req.user?.academicProfile?.sruBatchCode || req.user?.academicProfile?.batchCode || req.user?.academicProfile?.batch || '24BTCAIAIB10';
    let timetable = await getTimetableForBatch(batchCode);

    if (!timetable) {
      timetable = await Timetable.findOne({ sruBatchCode: '24BTCAIAIB10' }) || await Timetable.findOne();
    }

    if (!timetable) {
      return res.status(404).json({ error: `Timetable not found for batch ${batchCode}.` });
    }

    const currentDay = getDayName();
    const todayEntries = (timetable.entries || [])
      .filter((e) => e.day === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return res.json({
      status: 'fresh',
      today: todayEntries,
      entries: timetable.entries,
      day: currentDay,
      batch: timetable.sruBatchCode
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load today schedule.' });
  }
});

// GET /api/v1/timetable/current
router.get('/current', authenticate, async (req, res) => {
  try {
    const batchCode = req.query.batch || req.user?.academicProfile?.sruBatchCode || req.user?.academicProfile?.batchCode || req.user?.academicProfile?.batch || '24BTCAIAIB10';
    let timetable = await getTimetableForBatch(batchCode);

    if (!timetable) {
      timetable = await Timetable.findOne({ sruBatchCode: '24BTCAIAIB10' }) || await Timetable.findOne();
    }

    if (!timetable) {
      return res.status(404).json({ error: `Timetable not found for batch ${batchCode}.` });
    }

    const currentStatus = getClassStatus(timetable.entries || []);
    return res.json({
      status: 'fresh',
      timetableStatus: currentStatus.status,
      class: currentStatus.class,
      today: currentStatus.today,
      remainingClasses: currentStatus.today.filter((e) => e.startTime > getTimeKolkata()),
      entries: timetable.entries,
      lastUpdated: timetable.lastUpdated,
      batch: timetable.sruBatchCode
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to calculate class status.' });
  }
});

// POST /api/v1/timetable/import-csv - Administrator CSV import
router.post('/import-csv', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { degree, program, year, batch, sruBatchCode, csvContent } = req.body;
    if (!program || !batch || !sruBatchCode || !csvContent) {
      return res.status(400).json({ error: 'Program, batch, sruBatchCode, and csvContent are required.' });
    }

    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must contain a header and at least one record line.' });
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dayIdx = header.indexOf('day');
    const startIdx = header.indexOf('starttime');
    const endIdx = header.indexOf('endtime');
    const subjIdx = header.indexOf('subject');
    const roomIdx = header.indexOf('room');
    const facIdx = header.indexOf('faculty');
    const typeIdx = header.indexOf('type');
    const codeIdx = header.indexOf('coursecode');

    if (dayIdx === -1 || startIdx === -1 || subjIdx === -1) {
      return res.status(400).json({ error: 'CSV must include day, startTime, and subject columns.' });
    }

    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim());

      entries.push({
        id: `imp_${i}_${Date.now()}`,
        day: cols[dayIdx],
        startTime: cols[startIdx],
        endTime: endIdx !== -1 ? cols[endIdx] : undefined,
        subject: cols[subjIdx],
        room: roomIdx !== -1 ? cols[roomIdx] : '',
        faculty: facIdx !== -1 ? cols[facIdx] : '',
        type: typeIdx !== -1 ? cols[typeIdx] : 'Class',
        courseCode: codeIdx !== -1 ? cols[codeIdx] : ''
      });
    }

    const timetable = await Timetable.findOneAndUpdate(
      { sruBatchCode: sruBatchCode.trim() },
      {
        degree: degree?.trim() || 'B.Tech',
        program: program.trim(),
        year: year?.trim() || 'Year I',
        batch: batch.trim(),
        sruBatchCode: sruBatchCode.trim(),
        entries,
        lastUpdated: new Date(),
        source: 'ADMIN_CSV_IMPORT'
      },
      { upsert: true, new: true }
    );

    await logAudit({
      actor: req.user,
      action: 'TIMETABLE_IMPORTED',
      targetType: 'TIMETABLE',
      targetId: timetable._id,
      details: { sruBatchCode, entriesCount: entries.length },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${entries.length} timetable records for batch ${sruBatchCode}.`,
      timetable
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to import timetable CSV.' });
  }
});

export default router;
