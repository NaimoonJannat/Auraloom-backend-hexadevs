const express = require('express');
const cors = require('cors');
const multer = require('multer');  // Multer for file uploads
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Multer configuration for handling file uploads
const storage = multer.memoryStorage(); // Store file in memory (we'll upload to a cloud)
const upload = multer({ storage });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3ywizof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloud(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: file.mimetype.startsWith('audio') ? 'video' : 'image' }, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);  // Return the URL of the uploaded file
    }).end(file.buffer);
  });
}


async function run() {
    try {
        const database = client.db('Auraloom');
        const podcastCollection = database.collection("allPodcasts");

        // Endpoint for uploading a podcast (with image and audio)
        app.post('/upload-podcast', upload.fields([{ name: 'wallpaper' }, { name: 'audio' }]), async (req, res) => {
            const { title, details, category } = req.body;
            const wallpaper = req.files['wallpaper'] ? req.files['wallpaper'][0] : null;
            const audio = req.files['audio'] ? req.files['audio'][0] : null;

            // Here, you will upload the wallpaper and audio to a cloud storage service like S3, Cloudinary, etc.
            // After uploading, you'll get the URL for each file.
            const wallpaperURL = await uploadToCloud(wallpaper);
            const audioURL = await uploadToCloud(audio);

            // Save the podcast details and URLs in MongoDB
            const newPodcast = { title, details, category, wallpaperURL, audioURL };
            const result = await podcastCollection.insertOne(newPodcast);
            res.send(result);
        });

        // Endpoint to retrieve podcasts
        app.get('/podcasts', async (req, res) => {
            const cursor = podcastCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.log);

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});
