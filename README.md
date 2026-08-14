Getsy

A local-first marketplace that helps customers discover nearby shops, check real product availability, reserve items, and connect with local shop owners.

Getsy is a full-stack web platform built around a simple problem: local customers often do not know which nearby shop has the product they need, while small shop owners have limited digital visibility.

Instead of replacing local stores, Getsy gives them a digital catalogue and lets customers discover, compare, reserve, and navigate to nearby shops.

Highlights

Customer and shop-owner accounts with role-based access

Product discovery by category, type, and subtype

Real product catalogue and stock stored in MongoDB

Per-size stock tracking

Atomic stock decrement during reservations to prevent double-booking the last unit

48-hour reservations with automatic expiry and stock restoration

Customer wishlist

Shop reviews and ratings

Shop-owner dashboard for catalogue and reservation management

Product and shop image uploads

Customer and shop location selection

Nearby-shop discovery using distance calculations

OpenStreetMap and Leaflet map integration

Google Maps directions links

Community requests where customers can ask local shops for products

JWT access and refresh token authentication

Docker Compose setup with MongoDB

Seed/demo data for local testing

The problem

Local commerce has a visibility problem.

A customer may need a specific product but still have to:

Visit multiple shops.

Call different shop owners.

Ask whether the product is actually in stock.

Travel to a shop only to discover that the item or size is unavailable.

At the same time, many small local shops have inventory that is difficult for customers to discover online.

Getsy addresses the gap between local inventory and customer discovery.

How Getsy works

Customer
   |
   | Select location
   v
Discover nearby shops
   |
   | Browse real catalogues
   v
Find product + size + stock
   |
   | Reserve
   v
Stock is atomically decremented
   |
   | 48-hour reservation
   v
Visit shop / get directions

Shop owners use the other side of the platform:

Shop Owner
   |
   v
Register shop
   |
   v
Set shop location
   |
   v
Add products + stock + images
   |
   v
Receive customer reservations
   |
   v
Manage catalogue and shop activity

Core features

Customer experience

Customer registration and login

Location selection

Nearby shop discovery

Category-based browsing

Product detail pages

Size-specific stock visibility

Product reservations

Reservation status tracking

Automatic token refresh

Wishlist

Shop reviews and ratings

Google Maps directions

Community product requests

Shop owner experience

Owner registration with shop creation

Shop profile and location

Product catalogue management

Product image uploads

Size and stock management

Reservation management

Owner dashboard

Shop-level activity and review information

Inventory and reservation logic

Getsy does not simply create a reservation and hope that stock remains available.

When a customer reserves an item, the backend performs an atomic conditional MongoDB update:

Reserve request
      |
      v
Check requested size stock > 0
      |
      +---- No ----> Reservation rejected
      |
      +---- Yes ---> Stock decremented atomically
                         |
                         v
                    Reservation created

This prevents two simultaneous customers from successfully reserving the same final unit.

Active reservations are also limited per customer, and reservations expire automatically after the configured reservation period.

Location and maps

Getsy uses:

Leaflet for interactive maps

OpenStreetMap map tiles

Nominatim for place-name geocoding

Latitude/longitude coordinates stored with users and shops

Distance calculations for nearby-shop discovery

Google Maps links for turn-by-turn directions

The map layer does not require a Google Maps API key.

Nominatim is a public community service and is rate-limited. It should not be treated as an unlimited production geocoding API.

Technology stack

Frontend

React 18

React Router

Vite

JavaScript / JSX

CSS

Leaflet

Lucide React

Backend

Node.js

Express

MongoDB

Mongoose

JWT

bcryptjs

Multer

CORS

dotenv

Infrastructure

Docker

Docker Compose

MongoDB 7

Architecture

┌───────────────────────────────┐
│          React Frontend       │
│                               │
│ Landing / Discovery / Shop    │
│ Product / Auth / Dashboards   │
│ Community / Location / Mobile │
└───────────────┬───────────────┘
                │
                │ HTTP / JSON
                │ JWT
                ▼
┌───────────────────────────────┐
│       Express REST API        │
│                               │
│ Auth                          │
│ Browse                        │
│ Bookings                      │
│ Owner                         │
│ Community                     │
│ Users                         │
│ Wishlist                      │
│ Reviews                       │
└───────────────┬───────────────┘
                │
                │ Mongoose
                ▼
┌───────────────────────────────┐
│           MongoDB             │
│                               │
│ Users                         │
│ Shops                         │
│ Catalogue Items               │
│ Bookings                      │
│ Reviews                       │
│ Wishlists                     │
│ Community Requests            │
└───────────────────────────────┘

External services:
Leaflet / OpenStreetMap / Nominatim
Google Maps directions

Project structure

getsee_7/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── jobs/
│   │   └── expireReservations.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Booking.js
│   │   ├── CatalogueItem.js
│   │   ├── CommunityRequest.js
│   │   ├── Review.js
│   │   ├── Shop.js
│   │   ├── User.js
│   │   └── Wishlist.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── browse.js
│   │   ├── community.js
│   │   ├── owner.js
│   │   ├── reviews.js
│   │   ├── users.js
│   │   └── wishlist.js
│   ├── utils/
│   │   └── geocoder.js
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── scripts/
├── scratch/
├── docker-compose.yml
├── .gitignore
└── README.md

Getting started

There are two supported development paths.

Option A: Docker Compose

This is the easiest way to run the complete backend and database stack.

Prerequisites

Install:

Docker Desktop

Git

Then clone the repository:

git clone https://github.com/sahilvarpe8256-crypto/Getsy.git
cd Getsy

Start the application stack:

docker compose up --build

The backend runs on:

http://localhost:5000

The API health endpoint is:

http://localhost:5000/api/v1/health

The Docker setup starts:

MongoDB on port 27017

Express backend on port 5000

The MongoDB data is persisted in the Docker volume dukaan_mongo_data.

Stop the stack with:

docker compose down

Option B: Run locally without Docker

Prerequisites

Install:

Node.js LTS

MongoDB Community Server

Git

Backend

Open a terminal in backend:

cd backend
npm install

Create your environment file:

backend/.env

Use .env.example as the template.

Then seed the demo data:

npm run seed

Start the backend:

npm start

For development with automatic restart:

npm run dev

The API will run on:

http://localhost:5000

Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Vite will display the local development URL in the terminal, normally:

http://localhost:5173

For a production build:

npm run build

To preview the production build:

npm run preview

Environment variables

Never commit your real .env file.

The repository contains:

backend/.env.example

Typical backend configuration includes:

PORT=5000
MONGO_URI=mongodb://localhost:27017/dukaan
JWT_ACCESS_SECRET=replace_with_a_real_secret
JWT_REFRESH_SECRET=replace_with_a_real_secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
CLIENT_ORIGIN=http://localhost:5173
RESERVATION_HOURS=48

For Docker Compose, the backend receives its MongoDB connection string and other development settings from docker-compose.yml.

For anything beyond local development, use strong secrets and environment-specific configuration.

Demo data

The seed script creates demo users and shops for testing.

Role

Email

Password

Customer

priya@customer.test

password123

Owner

meena@shop.test

password123

Owner

rahul@shop.test

password123

Owner

om@shop.test

password123

These credentials are for local demonstration only.

Do not use these credentials in a production deployment.

Demo shop data is centred around Sangamner, Maharashtra.

API overview

The Express API is versioned under:

/api/v1

Main route groups include:

Route

Purpose

/api/v1/auth

Registration, login, token refresh

/api/v1

Browse shops and catalogue

/api/v1/bookings

Customer reservations

/api/v1/owner

Shop-owner operations

/api/v1/community

Community product requests and replies

/api/v1/users

User/location operations

/api/v1/wishlist

Customer wishlist

/api/v1

Reviews and related operations

/api/v1/health

Backend health check

Authentication

Getsy uses JWT-based authentication.

The authentication flow includes:

User registers or logs in.

Backend validates credentials.

Passwords are stored as bcrypt hashes.

Backend issues an access token and refresh token.

Frontend sends the access token using the Authorization header.

When an access token expires, the frontend attempts to refresh it.

Failed refresh authentication logs the user out locally.

Role-based authorization separates customer and owner operations.

Reservation lifecycle

A reservation follows this lifecycle:

Available
   |
   v
Reserved
   |
   +--------------------+
   |                    |
   v                    v
Confirmed in store    48-hour expiry
   |                    |
   v                    v
Paid / completed     Stock restored

The current implementation supports reservation, expiry, cancellation, in-store confirmation, and paid states in the booking model.

Current limitations

This repository is a working application prototype, not a finished commercial marketplace.

Current limitations include:

No real online payment gateway

Community requests are text-first

Local product uploads use the backend filesystem

Public Nominatim usage is rate-limited

No production-grade object storage

No production deployment configuration

No automated CI/CD pipeline

No comprehensive automated test suite

Demo credentials are intentionally included for local testing

These limitations are architectural boundaries for the current version, not hidden functionality.

Roadmap

Potential next-stage improvements:

Razorpay or another payment gateway

Cloud object storage for product images

Production-grade geocoding and maps infrastructure

Push notifications for reservation updates

SMS/WhatsApp notifications

Advanced inventory analytics

Shop-owner sales analytics

Search ranking and recommendation systems

Automated tests and CI

Production deployment

Rate limiting and stronger API security

Admin moderation and verification workflows

Community image attachments

Multi-language support

Security notes

Before deploying publicly:

Replace all development JWT secrets.

Configure a restricted CLIENT_ORIGIN.

Use HTTPS.

Move uploaded media to managed object storage.

Add API rate limiting.

Add production logging and monitoring.

Review CORS configuration.

Do not expose database credentials.

Do not commit .env files.

Do not use the demo passwords outside local testing.

Development commands

Backend

npm install
npm run dev
npm start
npm run seed
npm run verify-shops

Frontend

npm install
npm run dev
npm run build
npm run preview

Docker

docker compose up --build
docker compose down

License

No open-source license has currently been declared for this repository.

Until a license is added, the source code should not be assumed to be freely reusable, modified, or redistributed.

Project status

Current status: Working full-stack prototype

Frontend: React + Vite

Backend: Node.js + Express

Database: MongoDB

Authentication: JWT + bcrypt

Maps: Leaflet + OpenStreetMap + Nominatim

Containerization: Docker Compose