require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const promClient = require('prom-client');

const authRoutes = require('./routes/auth');
const stationRoutes = require('./routes/stations');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/horizonnet';
const SESSION_SECRET = process.env.SESSION_SECRET || 'supersecretdefaultkeychangeit';

// Prometheus metrics configuration
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['route', 'status_code']
});
register.registerMetric(httpRequestsTotal);

// Middleware to count all HTTP requests
app.use((req, res, next) => {
  res.on('finish', () => {
    // If route path matches, use that to prevent high-cardinality in Prometheus.
    // Otherwise fallback to req.path.
    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ route, status_code: res.statusCode });
  });
  next();
});

// Basic Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', authRoutes);
app.use('/api/stations', stationRoutes);

// Health Endpoint
app.get('/health', async (req, res) => {
  try {
    // Check if mongoose is connected and can ping the DB
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database is not connected');
    }
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'health_check_failure',
      error: error.message
    }));
    res.status(503).json({ status: "error" });
  }
});

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'metrics_fetch_error',
      error: error.message
    }));
    res.status(500).end(error);
  }
});

// Global unhandled error handler
app.use((err, req, res, next) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    event: 'unhandled_error',
    error: err.message,
    stack: err.stack
  }));
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Database connection & Server startup
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'db_connected',
      mongoUri: MONGO_URI
    }));

    app.listen(PORT, () => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        event: 'server_started',
        port: PORT
      }));
    });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'db_connection_failed',
      error: error.message
    }));
    process.exit(1);
  }
}

startServer();
