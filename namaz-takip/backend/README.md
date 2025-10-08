# Namaz-Takip Backend

Minimal Express + Mongoose backend for signup/login.

Setup:

1. cd backend
2. npm install
3. create a .env file from .env.example and set MONGO_URI
4. npm run dev

Endpoints:
- POST /api/signup { email, password }
- POST /api/login { email, password }

This is a minimal local-only auth example. For production you should add rate limiting, validation, and JWT/session management.
