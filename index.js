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
      const { name, email } = req.body; // Destructure name and email from the request body

      // Validate the request: Ensure name and email are non-empty strings
      if (!name || typeof name !== 'string' || !email || typeof email !== 'string') {
        return res.status(400).send({ message: 'Invalid input: Playlist name and email are required and should be valid strings.' });
      }

      const newPlaylist = {
        name: name.trim(), // Sanitize by trimming the input
        email: email.trim(), // Sanitize by trimming the input
        createdAt: new Date() // Optional: Add a timestamp for playlist creation
      };

      try {
        // Insert the new playlist into the collection
        const result = await playlistCollection.insertOne(newPlaylist);

        // Return the inserted playlist ID with a 201 status
        res.status(201).send({ message: 'Playlist created successfully', insertedId: result.insertedId });
      } catch (error) {
        console.error('Error creating playlist:', error);

        // Send a 500 status and the error message if something goes wrong
        res.status(500).send({ message: 'Failed to create playlist', error: error.message });
      }
    });

    // GET playlists filtered by email
    // GET playlists filtered by email
    app.get('/playlists', async (req, res) => {
      const userEmail = req.query.email; // Get email from query params

      if (!userEmail) {
        // Handle missing email
        return res.status(400).send({ message: 'Invalid or missing email parameter.' });
      }

      try {
        const playlists = await playlistCollection.find({ email: userEmail }).toArray();
        res.send(playlists);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).send({ message: 'Failed to fetch playlists.' });
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

    // POSTING A REVIEW
    app.post('/podcasts/:id/reviews', async (req, res) => {
      const { id } = req.params; // Podcast ID
      console.log(req.params.id);
      const { username, email, review } = req.body; // Review data
  
      try {  
          // Find the podcast by ID and add the new review to the comments array
          const result = await podcastCollection.updateOne(
              { _id: new ObjectId(id) }, // Find podcast by ID
              { $push: { comments: { username, email, review } } } // Add the new comment to the comments array
          );
  
          if (result.modifiedCount === 0) {
              return res.status(404).json({ message: 'Podcast not found' });
          }
  
          res.status(200).json({ message: 'Review added successfully' });
      } catch (error) {
          console.error('Error adding review:', error);
          res.status(500).json({ message: 'Server error' });
      }
  });

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

    // PATCH request to add a like (user's email) to a podcast
      app.patch('/podcasts/like/:id', async (req, res) => {
        const id = req.params.id;
        const email = req.query.email;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $addToSet: { likes: email } // Add user email to the 'likes' array, ensuring it's unique
        };

        try {
            const result = await podcastCollection.updateOne(filter, updateDoc);
            if (result.modifiedCount > 0) {
                res.status(200).send({ message: 'Podcast liked successfully!' });
            } else {
                res.status(404).send({ message: 'Podcast not found or already liked' });
            }
        } catch (error) {
            res.status(500).send({ error: 'Failed to like the podcast', details: error });
        }
      });

       // PATCH request to add a dislike (user's email) to a podcast
       app.patch('/podcasts/dislike/:id', async (req, res) => {
        const id = req.params.id;
        const email = req.query.email;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $addToSet: { dislikes: email } // Add user email to the 'dislikes' array, ensuring it's unique
        };

        try {
            const result = await podcastCollection.updateOne(filter, updateDoc);
            if (result.modifiedCount > 0) {
                res.status(200).send({ message: 'Podcast disliked successfully!' });
            } else {
                res.status(404).send({ message: 'Podcast not found or already disliked' });
            }
        } catch (error) {
            res.status(500).send({ error: 'Failed to dislike the podcast', details: error });
        }
      });


  
    // Get route for all podcasts by a specific creator
    app.get('/podcasts/creator/:creator', async (req, res) => {
      const creator = req.params.creator.trim(); // Trim any extra spaces
      let query;

      // Use case-insensitive regular expression to match the creator
      query = { creator: { $regex: new RegExp(creator, "i") } };

      console.log('creator parameter:', creator);
      console.log('Constructed query:', query);

      try {
        const results = await podcastCollection.find(query).toArray();
        console.log('Query results:', results);

        if (results.length > 0) {
          res.status(200).send(results);
        } else {
          res.status(404).send({ message: 'No podcasts found for this creator' });
        }
      } catch (error) {
        console.error('Error:', error);
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