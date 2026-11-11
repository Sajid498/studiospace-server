# StudioSpace — Backend API

**Project:** StudioSpace — Peer-to-Peer Creative Workspace & Production Studio Sharing Platform

**Live Frontend:** https://studiospace-client-six-ruddy.vercel.app  
**Live Backend:** https://studiospace-server-94ez.onrender.com  
**Backend Repository:** https://github.com/Sajid498/studiospace-server  
**Frontend Repository:** https://github.com/Sajid498/studiospace-client

## About

This repository contains the backend of StudioSpace, a platform that allows creative professionals to discover, list, and book production studios and creative workspaces.

The backend provides REST API functionality, authentication integration, database operations, studio management, booking management, and image upload handling.

## Technology Stack

| Category | Technologies |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Language | JavaScript (ES Modules) |
| Database | MongoDB |
| Authentication | Better Auth |
| Authorization | JWT |
| Security | Cookie Parser, CORS |
| Image Upload | Multer, ImgBB integration |
| Deployment | Render |

## Core Features

- **Authentication:** Better Auth integration with MongoDB.
- **JWT Authorization:** Protects restricted operations.
- **Studio Management:** Create, retrieve, update, and delete studio listings.
- **Booking Management:** Create booking requests and manage booking statuses.
- **Booking Conflict Prevention:** Checks overlapping confirmed bookings.
- **Input Validation:** Validates booking dates and booking status transitions.
- **Studio Privacy:** Public studio responses exclude private host email information.
- **Image Upload:** Supports studio image uploads through ImgBB integration.
- **MongoDB Integration:** Stores application data using MongoDB collections.

## Local Installation

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account or MongoDB instance
- ImgBB API key

### 1. Clone the repository

```bash
git clone https://github.com/Sajid498/studiospace-server.git
cd studiospace-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

Use the following template:

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=

MONGODB_URI=
DB_NAME=studiospace

JWT_SECRET=
IMGBB_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Add the appropriate values for your local MongoDB connection, authentication secrets, ImgBB API key, and Google OAuth configuration.

Never commit your actual `.env` file or publish private credentials.

### 4. Start the development server

```bash
npm run dev
```

The backend will run at:

http://localhost:5000

### 5. Production start

```bash
npm start
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the server with Nodemon |
| `npm start` | Start the production server |
| `npm test` | Test script placeholder; automated tests are not configured |

## Database

StudioSpace uses MongoDB for persistent application data.

The database name is configured through the `DB_NAME` environment variable.

Application data includes studio listings, booking records, and authentication-related information.

## API and Application Integration

The backend exposes API functionality for:

- Studio listing and retrieval
- Studio creation, updating, and deletion
- Booking creation and retrieval
- Booking cancellation and status management
- Image uploads
- Authentication integration

The frontend communicates with this backend through HTTP requests.

## Booking Validation

The booking system includes:

- Validation of booking dates and time ranges.
- Rejection of bookings with past start times.
- Prevention of overlapping confirmed bookings.
- Validation when a host confirms a booking.
- Prevention of completing a booking before its scheduled end time.

## Deployment

The backend is deployed on Render.

**Production API Base URL:**

https://studiospace-server-94ez.onrender.com

MongoDB Atlas is used for the production database.

## Related Repository

Frontend: https://github.com/Sajid498/studiospace-client

---

Developed as part of the StudioSpace full-stack project.