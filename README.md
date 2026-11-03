# BarberStory — backend core (v0.1, untested)

## Run
1. `cp .env.example .env` and fill it in (add `OWNER_EMAIL` / `OWNER_PIN` for the first owner).
2. `npm install && npx prisma migrate dev --name init && npm run db:seed && npm run dev`
3. Local portals: `auth.localhost:3000`, `kasir.localhost:3000`, `admin.localhost:3000`, `owner.localhost:3000`, `employee.localhost:3000`.

## Done
- Prisma schema: users, branches, sessions, cards, kiosk devices, attendance, services, transactions, commission rules and commissions, audit log
- Login: email + PIN (bcrypt), server-side sessions, parent-domain cookie, rate limit, role redirect
- Branch isolation helper (`branchScope`): branch always comes from the session
- POST /api/transactions: atomic, idempotent, server-side change, price snapshot, commission snapshot for artist and cashier
- POST /api/attendance/tap: kiosk device key, hashed card UID, branch timezone, late detection, anti double-tap
- Host-based routing for the five subdomains

## Not done
See the checklist in the chat reply.

## Stage 1 (added): login + cashier portal
- Pages: `/auth` login, `/cashier` dashboard, `/cashier/new` POS, `/cashier/history`, `/cashier/profile`
- Read APIs: `GET /api/services`, `GET /api/artists` (branch from session), `POST /api/auth/logout`
- Dev data: `npm run db:seed:dev` → login `kasir01@dev.local` / `123456` (fake, dev only)
- Local subdomains: add to your hosts file `127.0.0.1 auth.barberstory.test kasir.barberstory.test admin.barberstory.test owner.barberstory.test employee.barberstory.test`,
  set `COOKIE_DOMAIN=.barberstory.test`, update the `*_URL` vars (and add `NEXT_PUBLIC_AUTH_URL`), then open `http://auth.barberstory.test:3000`.
- Artists show "Available" only after an attendance check-in (the kiosk comes in stage 2). Until then every artist shows "Not checked in" but can still be selected.

## Stage 2 (added): employee portal (attendance skipped on purpose)
- Pages: `/employee` dashboard, `/employee/earnings` (cards, 7-day chart, date filter, history), `/employee/history`, `/employee/profile`
- Employees only ever query their own rows (`artistId` / `userId` = session user). Earnings = commission snapshots, so old rates never change.
- Dev login: `artist01@dev.local` / `123456` (after `npm run db:seed:dev`, make a transaction from the cashier portal first)
- `design/` holds the canvas mockups for reference (open them via the canvas link; they are not runnable on their own).
- Skipped for now: kiosk page, My Attendance page, attendance status on the dashboard and profile card status.

## Stage 3 (added): admin portal — 8 pages
- `/admin` Overview · `/analytics` · `/transactions` (+ `/transactions/[id]` detail) · `/cashiers` · `/artists` · `/attendance` · `/reports` (CSV export) · `/profile`
- Branch always from the admin session. Detail pages and CSV export filter by it too, so another branch's IDs just 404.
- Dev login: `admin01@dev.local` / `123456` (after `npm run db:seed:dev`).
- Not yet: PDF export, past-day absences (needs work schedules), attendance corrections.

## Stage 4 (added): owner portal — 11 pages
Overview · Branch Management · Revenue Analytics · All Transactions · Employee Management · Haircut Artists · Employee Attendance · Commission Management · Income & Expenses · Financial Reports · System Settings.
- Changes use Next.js server actions (`src/app/owner/actions.ts`); each action re-checks that the caller is OWNER. Edits/voids/PIN resets/commission approvals write to `AuditLog`.
- **Run `npx prisma migrate dev --name finance` after updating** (new tables: IncomeRecord, ExpenseRecord).
- First owner: set OWNER_EMAIL / OWNER_PIN in .env, then `npm run db:seed`.
- Not yet: PDF export, file upload for proof (link/note only), performance-based incentives, bulk commission approval, refunds.

## Stage 5 (added): attendance — all 30 pages now exist
- `/kiosk` (any portal host, e.g. employee.example.com/kiosk): shared branch tablet/PC. Paste the kiosk key once (Owner → System Settings → Attendance kiosk keys). A USB RFID/NFC reader that types the card UID + Enter works out of the box; no browser NFC needed.
- Register a card: Owner → Employee Management → Edit → Assign card (type the UID or tap the card into that field).
- `/employee/attendance` (My Attendance), plus attendance status on the employee dashboard and card status on the profile.
- Check the whole flow: cashier POS artist list shows "Available" once an artist has checked in.
- Still missing: work schedules, leave/absent automation, attendance corrections, lost-card procedure.

## Responsif (semua perangkat)
- Desktop (>1024px): sidebar penuh. Tablet (761-1024px): sidebar jadi deretan ikon (nama menu muncul saat kursor diarahkan). HP (<=760px): menu pindah ke bar bawah yang bisa digeser, aman untuk notch/home bar.
- Kartu statistik otomatis menyesuaikan jumlah kolom; halaman kasir menumpuk ke satu kolom di layar kecil; tabel digeser ke samping di dalam kartunya (halaman tidak ikut melebar).
- Input memakai ukuran huruf 16px di HP supaya iOS tidak zoom otomatis.
- File yang berubah: `src/app/globals.css`, `src/app/layout.tsx` (viewport), `src/components/PortalNav.tsx` (title tooltip), `src/app/cashier/new/pos.tsx`, dan halaman dengan kartu statistik.
