import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dataDir = join(process.cwd(), 'server', 'data');
const accountFile = join(dataDir, 'accounts.json');
const profileFile = join(dataDir, 'student-profiles.json');
const mappingFile = join(dataDir, 'sru-batch-mappings.json');
const sessions = new Map();
const loginAttempts = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
const readJson = async (file, fallback) => { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; } };
const writeJson = async (file, data) => { await mkdir(dataDir, { recursive: true }); await writeFile(file, `${JSON.stringify(data, null, 2)}\n`); };
const hash = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const safeAccount = ({ passwordHash, ...account }) => account;
const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

const pruneExpired = () => {
  const now = Date.now();
  for (const [token, session] of sessions) if (session.expiresAt <= now) sessions.delete(token);
  for (const [key, attempt] of loginAttempts) if (attempt.resetAt <= now) loginAttempts.delete(key);
};

export const publicStudent = (account) => account ? { id: account.id, name: account.name, email: account.email, academicProfile: account.academicProfile } : null;
export async function availableAcademicOptions() {
  const mappings = await readJson(mappingFile, []);
  return mappings.filter((mapping) => mapping.active).map(({ degree, program, year, batchNumber, academicSession }) => ({ degree, program, year, batch: String(batchNumber), academicYear: academicSession }));
}
export async function registerStudent({ name, email, password, academicProfile }) {
  const normalizedEmail = normaliseEmail(email);
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !password || password.length < 12) throw new Error('Enter your name, a valid email, and a password of at least 12 characters.');
  if (academicProfile?.university !== 'SR University' || !academicProfile.degree || !academicProfile.program || !academicProfile.year || !academicProfile.batch) throw new Error('Complete your SR University academic details.');
  const mappings = await readJson(mappingFile, []);
  const available = mappings.some((mapping) => mapping.active && mapping.degree === academicProfile.degree && mapping.program === academicProfile.program && mapping.year === academicProfile.year && String(mapping.batchNumber) === String(academicProfile.batch));
  if (!available) throw new Error("We couldn't find a timetable for that academic profile yet. Review your program, year and batch.");
  const accounts = await readJson(accountFile, []);
  if (accounts.some((account) => account.email === normalizedEmail)) throw new Error('An account already exists for this email.');
  const id = `stu_${randomBytes(9).toString('hex')}`;
  const account = { id, name: name.trim(), email: normalizedEmail, passwordHash: hash(password), createdAt: new Date().toISOString(), academicProfile };
  accounts.push(account); await writeJson(accountFile, accounts);
  const profiles = await readJson(profileFile, {}); profiles[id] = academicProfile; await writeJson(profileFile, profiles);
  return publicStudent(account);
}
export function canAttemptLogin(key) {
  pruneExpired();
  const attempt = loginAttempts.get(key);
  return !attempt || attempt.count < MAX_LOGIN_ATTEMPTS;
}

export function recordLoginFailure(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  else attempt.count += 1;
}

export function clearLoginFailures(key) { loginAttempts.delete(key); }

export async function authenticateStudent({ email, password }) {
  const accounts = await readJson(accountFile, []); const account = accounts.find((item) => item.email === normaliseEmail(email));
  if (!account || typeof password !== 'string') return null;
  const [salt, digest] = account.passwordHash.split(':');
  if (!salt || !digest) return null;
  const expected = Buffer.from(digest, 'hex'); const candidate = scryptSync(password, salt, 64);
  if (expected.length !== candidate.length || !timingSafeEqual(candidate, expected)) return null;
  return publicStudent(account);
}
export function createSession(student) { pruneExpired(); const token = randomBytes(32).toString('hex'); sessions.set(token, { student, expiresAt: Date.now() + SESSION_TTL_MS }); return token; }
export function getSession(cookieHeader = '') { const token = cookieHeader.match(/(?:^|;\s*)vynora_session=([^;]+)/)?.[1]; const session = token && sessions.get(token); if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); return null; } return { token, student: session.student }; }
export function removeSession(cookieHeader = '') { const token = cookieHeader.match(/(?:^|;\s*)vynora_session=([^;]+)/)?.[1]; if (token) sessions.delete(token); }
