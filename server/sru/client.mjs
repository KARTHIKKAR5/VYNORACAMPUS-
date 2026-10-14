const SRU_ORIGIN = 'https://timetable.sruniv.com';

const getSetCookie = (headers) => headers.getSetCookie?.() ?? (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
const cookieHeader = (cookies) => cookies.map((value) => value.split(';')[0]).join('; ');

/** Server-only SR University client with timeout. */
export async function fetchSruTimetable({ sruBatchCode, year }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const page = await fetch(`${SRU_ORIGIN}/batchReport`, { 
      headers: { Accept: 'text/html' },
      signal: controller.signal
    });
    if (!page.ok) throw new Error(`SRU timetable page returned ${page.status}`);
    const html = await page.text();
    const token = html.match(/name=["']_token["'][^>]*value=["']([^"']+)/i)?.[1]
      ?? html.match(/csrf-token["'][^>]*content=["']([^"']+)/i)?.[1];
    if (!token) throw new Error('SRU timetable page did not provide a CSRF token (student timetables have moved to student portal)');

    const body = new URLSearchParams({ _token: token, batch: sruBatchCode, year });
    const response = await fetch(`${SRU_ORIGIN}/searchBatchReportPublic`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Origin: SRU_ORIGIN,
        Referer: `${SRU_ORIGIN}/batchReport`,
        Cookie: cookieHeader(getSetCookie(page.headers)),
        'X-Requested-With': 'XMLHttpRequest',
      },
      body,
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`SRU timetable search returned ${response.status}`);
    const payload = await response.json();
    if (payload?.success === false) throw new Error(payload.message || 'SRU did not find a timetable');
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

/** Administrative mapping discovery with timeout. */
export async function fetchSruBatchOptions({ degree, year }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const params = new URLSearchParams(year ? { degree, year } : { degree });
    const path = year ? '/get-batchbpublic' : '/get-yearbpublic';
    const response = await fetch(`${SRU_ORIGIN}${path}?${params}`, { 
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`SRU academic option lookup returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

