# HorizonNet Lite

A Node.js + Express + MongoDB satellite ground station monitoring dashboard.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally or accessible via URI

## Setup & Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy the example environment file and fill in your values (e.g. MongoDB Connection String):
   ```bash
   cp .env.example .env
   ```

3. Seed sample data into MongoDB:
   ```bash
   npm run seed
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Access the application in your browser:
   - Dashboard Login: `http://localhost:3000/login.html` (Use user `admin` with the password from your `.env` file, default is `changeme123`).
   - Health Check: `http://localhost:3000/health`
   - Prometheus Metrics: `http://localhost:3000/metrics`
