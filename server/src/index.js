const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

// Register global exception handlers for runtime stability
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down server...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION] Shutting down server...');
  console.error(err);
  process.exit(1);
});

const connectDB = require('./database/connection');
const apiRouter = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = config.port;

// Connect to MongoDB Atlas
connectDB();

// Global Middlewares
app.use(helmet());
app.use(cors({ origin: config.clientUrl }));
app.use(morgan('dev'));
app.use(express.json());

// Main Routing mount
app.use('/api', apiRouter);

// Centralized error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Express backend server listening on port ${PORT} in ${config.nodeEnv} mode`);
});
