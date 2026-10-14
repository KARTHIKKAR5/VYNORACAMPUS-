const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const value = (source, candidates) => candidates.map((key) => source?.[key]).find((item) => item !== undefined && item !== null && item !== '');
const string = (item) => typeof item === 'string' ? item.trim() : item == null ? undefined : String(item);

function endFrom(start, source) {
  const explicit = value(source, ['endTime', 'end_time', 'to', 'end']);
  if (explicit) return string(explicit);
  const [hour, minute = '00'] = String(start).split(':').map(Number);
  if (!Number.isFinite(hour)) return undefined;
  return `${String((hour + 1) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Converts an unknown SRU response into Vynora-owned timetable entries. */
export function normalizeSruTimetable(payload, profile) {
  const source = payload?.data ?? payload;
  const entries = [];
  for (const day of DAYS) {
    const slots = source?.[day] ?? source?.[day.toLowerCase()] ?? {};
    for (const [startTime, rawSlot] of Object.entries(slots)) {
      const classes = Array.isArray(rawSlot) ? rawSlot : rawSlot ? [rawSlot] : [];
      for (const raw of classes) {
        if (!raw || typeof raw !== 'object') continue;
        const subject = string(value(raw, ['subject', 'subject_name', 'courseName', 'course_name', 'title', 'name']));
        if (!subject) continue; // Empty SRU slots are not classes.
        entries.push({
          id: `${profile.sruBatchCode}:${day}:${startTime}:${subject}`,
          university: 'SR University', academicYear: profile.academicYear, program: profile.program,
          year: profile.year, batch: profile.batch, sruBatchCode: profile.sruBatchCode,
          day, startTime: string(value(raw, ['time', 'startTime', 'start_time', 'from'])) ?? startTime,
          endTime: endFrom(startTime, raw), subject,
          courseCode: string(value(raw, ['coursecode', 'courseCode', 'course_code', 'code', 'subject_code'])),
          faculty: string(value(raw, ['facultyName', 'faculty', 'faculty_name', 'teacher', 'staff_name'])),
          room: string(value(raw, ['room_name', 'room', 'room_no', 'roomNumber', 'location'])),
          type: string(value(raw, ['ltp', 'type', 'class_type', 'activity'])),
          rawData: raw, source: 'sru', fetchedAt: new Date().toISOString(),
        });
      }
    }
  }
  return entries;
}
