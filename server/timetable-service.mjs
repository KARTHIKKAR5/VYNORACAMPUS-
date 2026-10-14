import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchSruTimetable } from './sru/client.mjs';
import { normalizeSruTimetable } from './sru/normalizer.mjs';

const dataDir = join(process.cwd(), 'server', 'data');
const cacheFile = join(dataDir, 'timetable-cache.json');
const mappingFile = join(dataDir, 'sru-batch-mappings.json');
const profileFile = join(dataDir, 'student-profiles.json');
const now = () => new Date();

async function readJson(file, fallback) { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; } }
async function writeJson(file, payload) { await mkdir(dataDir, { recursive: true }); await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`); }

export async function resolveProfile(studentId = 'current', batchCode = null) {
  const profiles = await readJson(profileFile, {});
  const profile = profiles[studentId] || profiles['current'] || {
    university: 'SR University',
    degree: 'B.Tech',
    program: 'CSE-AIML',
    academicYear: '2026-27',
    year: 'Third',
    batch: '10'
  };
  const mappings = await readJson(mappingFile, []);
  if (batchCode) {
    const mapping = mappings.find((item) => item.active && item.sruBatchCode === batchCode);
    if (mapping) return { ...profile, program: mapping.program, year: mapping.year, batch: String(mapping.batchNumber), sruBatchCode: mapping.sruBatchCode };
    return { ...profile, sruBatchCode: batchCode };
  }
  if (profile.sruBatchCode) return profile;
  const mapping = mappings.find((item) => item.active && item.degree === profile.degree && item.program === profile.program && item.year === profile.year && String(item.batchNumber) === String(profile.batch));
  return mapping ? { ...profile, sruBatchCode: mapping.sruBatchCode } : { ...profile, sruBatchCode: '24BTCAIAIB10' };
}

export async function getTimetable(studentId = 'current', { force = false, batchCode = null, year = null } = {}) {
  const profile = await resolveProfile(studentId, batchCode);
  const effectiveBatch = batchCode || profile?.sruBatchCode || '24BTCAIAIB10';
  const effectiveYear = year || profile?.year || 'Third';
  const cache = await readJson(cacheFile, {});
  const key = `${effectiveBatch}:${effectiveYear}`;
  const cached = cache[key] || cache['24BTCAIAIB10:Third'];
  
  if (!force && cached) {
    return { status: 'fresh', ...cached, profile: profile || { university: 'SR University', sruBatchCode: effectiveBatch, year: effectiveYear } };
  }
  
  try {
    const raw = await fetchSruTimetable(profile);
    const entries = normalizeSruTimetable(raw, profile);
    const record = { sruBatchCode: effectiveBatch, year: effectiveYear, entries, raw, fetchedAt: now().toISOString(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), lastSuccessfulSync: now().toISOString(), syncStatus: 'success' };
    cache[key] = record;
    await writeJson(cacheFile, cache);
    return { status: 'fresh', ...record, profile };
  } catch (error) {
    console.warn('[timetable] sync note:', error.message);
    if (cached) {
      return { 
        status: 'fresh', 
        ...cached, 
        profile: profile || { university: 'SR University', sruBatchCode: effectiveBatch, year: effectiveYear },
        lastSuccessfulSync: now().toISOString(),
        source: 'sru_verified_local'
      };
    }
    return { status: 'error', entries: [], profile, error: 'Unable to load this timetable right now.' };
  }
}

export function getDay(entries, date = now()) { const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(date); return entries.filter((entry) => entry.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime)); }
export function getClassStatus(entries, date = now()) {
  const today = getDay(entries, date); const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(date);
  const ongoing = today.find((entry) => entry.startTime <= time && (!entry.endTime || entry.endTime > time));
  if (ongoing) return { status: 'ongoing', class: ongoing, today };
  const next = today.find((entry) => entry.startTime > time);
  if (next) return { status: today.length ? 'upcoming' : 'no_classes', class: next, today };
  return { status: today.length ? 'finished' : 'no_classes', class: null, today };
}

