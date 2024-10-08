const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
  origin: ['http://localhost:3000', 'https://auraloom-hexa-devs.vercel.app'],
  credentials: true
}));
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3ywizof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB url mirza
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0pky6me.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //   await client.connect();

    const database = client.db('Auraloom');
    const podcastCollection = database.collection("allPodcasts");
    const userCollection = database.collection("allUsers");
    const playlistCollection = database.collection("playlists");


    // CREATE a new playlist
    app.post('/playlists', async (req, res) => {
      const newPlaylist = req.body;

      try {
        // Insert the new playlist into the collection
        const result = await playlistCollection.insertOne(newPlaylist);

        // Return the inserted playlist ID with a 201 status
        res.status(201).send({ insertedId: result.insertedId });
      } catch (error) {
        console.error('Error creating playlist:', error);

        // Send a 500 status and the error message if something goes wrong
        res.status(500).send({ message: 'Failed to create playlist', error });
      }
    });




    // to send users backend
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    })


    // Getting all users
    app.get('/users', async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // to send assignments backend 
    app.post('/podcasts', async (req, res) => {
      const newPodcast = req.body;
      console.log(newPodcast);
      const result = await podcastCollection.insertOne(newPodcast);
      res.send(result);
    })


    // GETTING ALL PODCASTS
    app.get('/podcasts', async (req, res) => {
      const cursor = podcastCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // SEARCHING PODCAST
    app.get('podcasts/:searchText', async (req, res) => {
      const searchText = req.params.searchText;
      console.log(searchText);


      const query = {
        name: { $regex: searchText, $options: 'i' },
      };

      const cursor = podcastCollection.find(query);
      const result = await cursor.toArray();
      // const result = await cursor.find(query).toArray();

      console.log(result);
      res.send(result);
    })


    // GETTING A SINGLE PODCAST FOR DETAILS PAGE
    app.get('/podcasts/:id', async (req, res) => {
      const id = req.params.id;
      let query;

      // Check if id is a valid ObjectId
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      } else {
        // Handle invalid ObjectId cases, or use plain string id
        query = { _id: id };  // only use this if _id in the database is a string
      }

      console.log('ID:', id);
      console.log('Query:', query);

      try {
        const result = await podcastCollection.findOne(query);
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(404).send({ message: 'Podcast not found' });
        }
      } catch (error) {
        res.status(500).send({ error: 'Something went wrong', details: error });
      }
    });

    //   app.get('/podcasts/:id', async(req, res)=>{
    //     const id = req.params.id;
    //     const query = {_id: new ObjectId(id)};
    //     const result = await podcastCollection.findOne(query);
    //     res.send(result);
    // })

    // HANDLING FAVICON ERROR
    app.get('/favicon.ico', (req, res) => res.status(204));

    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.log);
app.get('/', (req, res) => {
  res.send('Auraloom Server Running')
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})