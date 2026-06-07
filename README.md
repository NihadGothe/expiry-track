# ExpiryTrack v2

A self-hosted service renewal tracker built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. Track expiry dates for domains, SSL certificates, VPS subscriptions, licenses, and more — with automated reminders via Telegram, Email, and WhatsApp.

---

## Features

- **Service Tracking** — Manage domains, SSL certs, VPS instances, licenses, and subscriptions in one place
- **Expiry Alerts** — Automated reminders at 30, 15, 7, and 1 day(s) before expiry
- **Multi-channel Notifications** — Telegram bot, Email (SMTP), and WhatsApp support
- **Bulk Upload** — Import services in bulk via Excel/CSV
- **User Management** — Admin and viewer roles with JWT-based authentication
- **Dashboard** — Visual overview of active, expiring, and expired services
- **Zero external DB** — Uses embedded NeDB (file-based), no database setup required

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Next.js 15 (App Router)           |
| Language     | TypeScript                        |
| Styling      | Tailwind CSS                      |
| Database     | NeDB (embedded, file-based)       |
| Auth         | JWT via `jose` + bcrypt           |
| Notifications| Telegram Bot API, Nodemailer, WhatsApp |
| File Import  | `xlsx` library                    |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd renewalhub-v2

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

| Role    | Email                   | Password   |
|---------|-------------------------|------------|
| Admin   | admin@company.com       | admin123   |
| Viewer  | manager@company.com     | admin123   |

> **Important:** Change these credentials immediately after first login.

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Protected app routes
│   │   ├── services/           # Service list, add, edit, bulk upload
│   │   ├── users/              # User management (admin only)
│   │   ├── settings/           # Notification settings
│   │   └── notifications/      # Notification history
│   ├── api/                    # API routes
│   │   ├── auth/               # Login / logout
│   │   ├── services/           # CRUD for services
│   │   ├── users/              # User management
│   │   ├── settings/           # Telegram, email, WhatsApp settings
│   │   ├── cron/               # Renewal reminder cron job
│   │   ├── bulk-upload/        # Excel/CSV import
│   │   ├── test-telegram/      # Test Telegram notifications
│   │   ├── test-email/         # Test email notifications
│   │   └── test-whatsapp/      # Test WhatsApp notifications
│   ├── login/                  # Login page
│   └── layout.tsx
├── components/
│   ├── Sidebar.tsx
│   └── TopBar.tsx
└── lib/
    ├── db.ts                   # Database layer (NeDB)
    ├── auth.ts                 # JWT session helpers
    └── telegram.ts             # Notification senders & message builders
data/                           # Auto-created at runtime (NeDB files)
```

---

## Notifications Setup

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the bot token
2. Get your chat ID(s)
3. Go to **Settings → Telegram** in the app and enter the token and chat IDs
4. Use **Test** to verify the connection

### Email (SMTP)

1. Go to **Settings → Email**
2. Enter your SMTP host, port, credentials, and recipient addresses
3. Use **Test Email** to verify

### WhatsApp

Configure via **Settings → WhatsApp** in the app.

---

## Cron Job (Automated Reminders)

The reminder cron job runs at `/api/cron`. Set up an external cron service (e.g. cron-job.org, GitHub Actions, or your server's crontab) to hit this endpoint daily:

```
GET https://yourdomain.com/api/cron?secret=YOUR_CRON_SECRET
```

Set `CRON_SECRET` in your environment to secure the endpoint. On localhost, the secret is not required.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
CRON_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret-here
```

---

## Building for Production

```bash
npm run build
npm run start
```

---

## License

MIT
