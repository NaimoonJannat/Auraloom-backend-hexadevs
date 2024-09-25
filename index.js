const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;

// middleware 
app.use(cors({
    origin: ['http://localhost:5173','https://b9a11-studybud.web.app','https://b9a11-studybud-client.vercel.app'],
    credentials: true
  }));
  app.use(express.json())