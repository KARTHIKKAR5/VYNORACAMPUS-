# VYNORA CAMPUS+

## Product
Vynora Campus+ is the digital operating system for students and campus life. Vynora Pulse is its calm, real-time intelligence layer: helping students understand what is useful now without becoming a noisy social feed.

## Current implementation
This is a React + TypeScript + Vite prototype with a lightweight Node timetable service. The product shell exposes Home, Network, Community, Projects, Resources, Messages, Pulse, Events, and Campus Services. State lives in `App.tsx` for the current prototype, deliberately shaped around backend-ready entities (Student, Project, connection, request, notification, message). The timetable service is server-only and owns SRU CSRF/session handling, normalization, mapping and cache boundaries.

The local auth prototype uses server-side scrypt password hashes, JSON development repositories, and an in-memory HTTP-only session cookie. It supports registration, sign in, sign out API endpoints and a two-step SR University academic-profile onboarding flow. This is appropriate for local development only: sessions need a durable store, HTTPS + secure cookie, CSRF protection, email verification, rate limiting and a database before production.

## Design direction
“Campus field guide”: warm paper surfaces, deep ink typography, field-note metadata, restrained green signal states and editorial layouts. It avoids generic dashboard card grids. Pulse is intentionally more spatial and live than workspace screens.

## Working flows
- Student discovery: search → profile panel → connect state.
- Community: create post → success feedback; offer help → requester notified state.
- Projects: create → appears in discovery; request to join → owner review on Home → accept → membership count and notification update.
- Messages: message is appended locally.
- Resources: bookmark state; Events/Campus Services discovery and room availability.
- Timetable: `/api/timetable/{today,current,next,week}` is backed by `server/`, which fetches SRU only on the server and serves a normalized/cacheable result. The weekly timetable is at `/#timetable`.
- SRU verification (September 2026): the server-side CSRF/session flow was successfully tested against the public first-test profile without persisting it. Observed populated record fields include `time`, `subject`, `facultyName`, `room_name`, `ltp`, and `coursecode`; `server/sru/normalizer.mjs` maps these into the Vynora model.

## Conventions / future work
Use centralized service/data layers for real APIs; do not scatter data through components. Preserve the responsive desktop sidebar/mobile navigation behavior and semantic controls. `server/data` is an intentionally local development store: production must replace it with repositories, enforce authentication for sync/admin operations, and seed verified `SruBatchMapping` records without exposing SRU batch codes to students. Extend the components currently located in `App.tsx` into `features/` once their complexity needs independent ownership.
