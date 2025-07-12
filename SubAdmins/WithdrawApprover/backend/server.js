require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { pool, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Parse cookies manually
app.use((req, res, next) => {
  req.cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      req.cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }
  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Log all requests
app.use((req, res, next) => {
  next();
});

// Test database connection
testConnection()
  .then(isConnected => {
    if (!isConnected) {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }
  });

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
});

// Import and use withdrawal routes
const withdrawalRoutes = require('./routes/withdrawalRoutes');
app.use('/api', withdrawalRoutes);

// Log all available routes
const printRoutes = (routes, parentPath = '') => {
  routes.forEach(route => {
    if (route.route) {
      // This is a regular route
      const methods = Object.keys(route.route.methods).join(',').toUpperCase();
    } else if (route.name === 'router' || route.name === 'bound dispatch') {
      // This is a router middleware
      const path = route.regexp.toString().split('\\/')[1] || '';
      printRoutes(route.handle.stack, `${parentPath}${path ? `/${path}` : ''}`);
    }
  });
};

// Log all registered routes after server starts
app.on('listening', () => {
  console.log('\nRegistered Routes:');
  app._router.stack.forEach(printRoutes);
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});