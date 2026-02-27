const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const apiRoutes = require('./routes');

dotenv.config();

const app = express();

// Basic security & logging
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
);
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy', data: null });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

