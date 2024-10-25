const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://auraloom-hexa-devs.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());

// Mongo URL Prapti
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3ywizof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("Auraloom");
    const podcastCollection = database.collection("allPodcasts");
    const userCollection = database.collection("allUsers");
    const playlistCollection = database.collection("playlists");

    // CREATE a new playlist
    app.post('/playlists', async (req, res) => {
      const newPlaylist = req.body;
      console.log(newPlaylist);
      const result = await playlistCollection.insertOne(newPlaylist);
      res.send(result)
    })

    //GET playlists name
    app.get('/playlists', async (req, res) => {
      const result = await playlistCollection.find().toArray();
      res.send(result)
    })

    //GET playlists filtered by email
    app.get('/playlists/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await playlistCollection.find(query).toArray()
      res.send(result)
    })

    //GET playlists filtered by Id
    app.get('/playlists/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await playlistCollection.findOne(query)
      res.json(result)
    })



    // to send users backend
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      // console.log(newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    // Getting all users
    app.get('/users', async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // to send podcasts backend
    app.post("/podcasts", async (req, res) => {
      const newPodcast = req.body;
      // console.log(newPodcast);
      const result = await podcastCollection.insertOne(newPodcast);
      res.send(result);
    });

     // Getting all podcasts
     app.get('/podcasts', async (req, res) => {
      const cursor = podcastCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

// GETTING ALL PODCASTS with optional pagination and search
app.get('/podcasts-pagination', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const searchText = req.query.search || ""; // Get search text from query params
  const skip = (page - 1) * limit;
  const query = searchText
      ? { title: { $regex: searchText, $options: "i" } } // Case-insensitive regex search
      : {}; // No filter if no search text

  try {
      // Fetch the podcasts based on the query
      const podcasts = await podcastCollection.find(query).skip(skip).limit(limit).toArray();
      res.send(podcasts);
  } catch (error) {
      console.error('Error fetching podcasts:', error);
      res.status(500).send({ message: 'Failed to fetch podcasts.' });
  }
});

// GETTING TOTAL PODCASTS COUNT FOR PAGINATION
app.get('/podcasts-pagination/count', async (req, res) => {
  const searchText = req.query.search || "";
  const query = searchText
      ? { title: { $regex: searchText, $options: "i" } } // Case-insensitive regex search
      : {}; // No filter if no search text

  try {
      // Get the count of documents based on the query
      const totalPodcasts = await podcastCollection.countDocuments(query);
      // Return the count in the correct format as an object
      res.send({ totalPodcasts });
  } catch (error) {
      console.error('Error fetching podcast count:', error);
      res.status(500).send({ message: 'Failed to fetch podcast count.' });
  }
});


  //email filtering for viewing a creator's podcast on creator dashboard
  app.get('/creator-podcasts/:email',async(req,res) =>
    {
      const email = req.params.email;
      const query = { email: email }
      const result = await podcastCollection.find(query).toArray()
      res.send(result) 
    })
    //role update of users 
    app.patch("/users/update/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email };
      const updateDoc = {
       $set: { ...user, timestamp: Date.now() },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // POSTING A REVIEW
    app.post("/podcasts/:id/reviews", async (req, res) => {
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
          return res.status(404).json({ message: "Podcast not found" });
        }

        res.status(200).json({ message: "Review added successfully" });
      } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // SEARCHING PODCAST
    app.get("podcasts/:searchText", async (req, res) => {
      const searchText = req.params.searchText;
      console.log(searchText);

      const query = {
        name: { $regex: searchText, $options: "i" },
      };

      const cursor = podcastCollection.find(query);
      const result = await cursor.toArray();
      // const result = await cursor.find(query).toArray();

      console.log(result);
      res.send(result);
    });

    // GETTING A SINGLE PODCAST FOR DETAILS PAGE
    app.get("/podcasts/:id", async (req, res) => {
      const { id } = req.params;
      let query;
    
      // Check if id is a valid ObjectId
      if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
        query = { _id: new ObjectId(id) };
      } else {
        console.log("Invalid ID received:", id); // Log the invalid ID for debugging
        return res.status(400).send({ message: "Invalid podcast ID format" });
      }
    
      console.log("ID:", id);
      console.log("Query:", query);
    
      try {
        const result = await podcastCollection.findOne(query);
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(404).send({ message: "Podcast not found" });
        }
      } catch (error) {
        console.error("Error fetching podcast:", error);
        res.status(500).send({ error: "Something went wrong", details: error });
      }
    });
    

    // PATCH request to add a like (user's email) to a podcast
    app.patch("/podcasts/like/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
  
      const filter = { _id: new ObjectId(id) };
  
      try {
          // First, find the podcast to check if the user has already liked or disliked it
          const podcast = await podcastCollection.findOne(filter);
          if (!podcast) {
              return res.status(404).send({ message: "Podcast not found" });
          }
  
          const alreadyLiked = podcast.likes.includes(email);
          const alreadyDisliked = podcast.dislikes.includes(email);
  
          const updateDoc = {
              $pull: { dislikes: email }, // Always remove the email from dislikes
          };
  
          if (alreadyLiked) {
              updateDoc.$pull.likes = email; // If already liked, remove the like
          } else {
              updateDoc.$addToSet = { likes: email }; // Otherwise, add the like
          }
  
          await podcastCollection.updateOne(filter, updateDoc);
  
          // Fetch and return the updated podcast
          const updatedPodcast = await podcastCollection.findOne(filter);
          res.status(200).json(updatedPodcast);
  
      } catch (error) {
          res.status(500).send({ error: "Failed to like the podcast", details: error.message });
      }
  });
  
  
  
  

    // PATCH request to add a dislike (user's email) to a podcast
    app.patch("/podcasts/dislike/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
  
      const filter = { _id: new ObjectId(id) };
  
      try {
          // First, find the podcast to check if the user has already liked or disliked it
          const podcast = await podcastCollection.findOne(filter);
          if (!podcast) {
              return res.status(404).send({ message: "Podcast not found" });
          }
  
          const alreadyLiked = podcast.likes.includes(email);
          const alreadyDisliked = podcast.dislikes.includes(email);
  
          const updateDoc = {
              $pull: { likes: email }, // Always remove the email from likes
          };
  
          if (alreadyDisliked) {
              updateDoc.$pull.dislikes = email; // If already disliked, remove the dislike
          } else {
              updateDoc.$addToSet = { dislikes: email }; // Otherwise, add the dislike
          }
  
          await podcastCollection.updateOne(filter, updateDoc);
  
          // Fetch and return the updated podcast
          const updatedPodcast = await podcastCollection.findOne(filter);
          res.status(200).json(updatedPodcast);
  
      } catch (error) {
          res.status(500).send({ error: "Failed to dislike the podcast", details: error.message });
      }
  });
  
  
  
  


    // Get route for all podcasts by a specific creator
    app.get("/podcasts/creator/:creator", async (req, res) => {
      const creator = req.params.creator.trim(); // Trim any extra spaces
      let query;

      // Use case-insensitive regular expression to match the creator
      query = { creator: { $regex: new RegExp(creator, "i") } };

      console.log("creator parameter:", creator);
      console.log("Constructed query:", query);

      try {
        const results = await podcastCollection.find(query).toArray();
        console.log("Query results:", results);

        if (results.length > 0) {
          res.status(200).send(results);
        } else {
          res
            .status(404)
            .send({ message: "No podcasts found for this creator" });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: "Something went wrong", details: error });
      }
    });

    //   app.get('/podcasts/:id', async(req, res)=>{
    //     const id = req.params.id;
    //     const query = {_id: new ObjectId(id)};
    //     const result = await podcastCollection.findOne(query);
    //     res.send(result);
    // })

    // HANDLING FAVICON ERROR
    app.get("/favicon.ico", (req, res) => res.status(204));

    
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }

}
run().catch(console.log);
app.get("/", (req, res) => {
  res.send("Auraloom Server Running");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
