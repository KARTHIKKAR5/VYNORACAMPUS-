# Vynora timetable service

Run `npm run timetable:dev` alongside Vite. This is a server-side SR University integration boundary; it fetches the public SRU page to obtain the per-session CSRF token and cookie, then posts the batch request. No SRU tokens or cookies are sent to the browser.

Production should replace the JSON mapping/cache stores with database repositories and protect `POST /api/timetable/sync` with admin/service authorization. Add profiles and active `SruBatchMapping` records through authenticated account/admin flows; do not expose `sruBatchCode` to students.

For mapping administration, SRU's public selector flow is encapsulated server-side: degree → `get-yearbpublic`, degree + year → `get-batchbpublic`. `GET /api/admin/timetable/options` and `GET /api/admin/timetable/inspect` require `VYNORA_ADMIN_KEY` and the matching `x-vynora-admin-key` request header; until that key exists they intentionally deny all access.
