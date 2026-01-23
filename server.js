require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://centric-task.vercel.app',
    'https://hubpost.community',
    'https://www.hubpost.community'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority'
    });
  } catch (error) {
    console.error("DB Connection Error:", error.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));

app.get("/", (req, res) => {
  res.json({
    api: "running",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
    connectionState: mongoose.STATES[mongoose.connection.readyState],
    timestamp: new Date().toISOString()
  });
});

app.get("/health", async (req, res) => {
  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) throw new Error("DB not ready");
    
    await mongoose.connection.db.admin().ping();
    res.json({
      status: "healthy",
      dbName: mongoose.connection.name,
      connectionState: mongoose.STATES[mongoose.connection.readyState]
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      error: err.message
    });
  }
});

module.exports = app;