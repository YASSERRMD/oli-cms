# Secure CMS

A production-ready, secure Content Management System built with Node.js and Express. Features JSON file-based storage for simplicity and portability, with enterprise-grade security measures.

## Features

- **JSON File Storage** - Simple, portable data storage without database dependencies
- **Security First** - Helmet, CORS, CSRF protection, rate limiting, and secure sessions
- **File Uploads** - Secure file upload handling with Multer
- **Input Validation** - Request validation using express-validator
- **Logging** - Request logging with Morgan
- **Environment Configuration** - Flexible configuration via environment variables

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd secure-cms
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your configuration values:
   ```
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-secure-secret
   COOKIE_SECRET=your-cookie-secret
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with hot-reload enabled via Nodemon.

### Production Mode

```bash
npm start
```

## Running Tests

```bash
npm test
```

## Project Structure

```
secure-cms/
├── middleware/          # Custom Express middleware
├── routes/              # API route handlers
├── utils/               # Utility functions and helpers
├── data/                # JSON file storage
│   ├── pages/           # Page content storage
│   ├── uploads/         # Uploaded file metadata
│   └── generators/      # Generated content storage
├── logs/                # Application logs
├── public/              # Static files (CSS, JS, images)
├── tests/               # Test files
├── server.js            # Application entry point
├── package.json         # Dependencies and scripts
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
└── README.md            # This file
```

## Security Features

| Feature | Description |
|---------|-------------|
| Helmet | Secure HTTP headers |
| CORS | Cross-Origin Resource Sharing protection |
| CSRF | Cross-Site Request Forgery protection |
| Rate Limiting | Request throttling to prevent abuse |
| Session Security | Secure cookie-based sessions |
| Input Validation | Request sanitization and validation |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `SESSION_SECRET` | Session encryption key | - |
| `COOKIE_SECRET` | Cookie signing key | - |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## License

ISC
