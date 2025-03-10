require("dotenv").config();
const cors = require("cors");
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Access the "ChillGamerDB" database
const chillGamer = client.db("ChillGamerDB");

// Helper function to get a collection by name
const getCollection = (collectionName) => {
  const collection = chillGamer.collection(collectionName);
  return collection;
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    /** Review related CRUD Operation Start */
    //Create a new review
    app.post("/review", async (req, res) => {
      try {
        const review = req.body;
        // Validating the incoming data
        if (!review || Object.keys(review).length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid data" });
        }
        // Insert the new review into the "ReviewCollection"
        const result = await getCollection("ReviewCollection").insertOne(
          review
        );
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Retrieve all reviews
    app.get("/reviews", async (req, res) => {
      try {
        const reviews = await getCollection("ReviewCollection")
          .find()
          .toArray();
        res.status(200).json(reviews);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Find single single by id
    app.get("/review/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const review = await getCollection("ReviewCollection").findOne(id);
        if (!review) {
          return res
            .status(404)
            .json({ success: false, message: "Review not found" });
        }
        res.status(200).json(review);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Get the highest rated games
    app.get("/highRatedGames", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 5; // Default to 5 if limit is not provide
        const games = await getCollection("ReviewCollection")
          .find({ rating: { $in: ["9", "10"] } }) // Filter rating that are either "9" or "10"
          .sort({ rating: -1 }) // Sort by rating in descending order
          .limit(limit) // Limit the number of results
          .toArray();
        if (!games.length) {
          return res.status(404).json({
            success: false,
            message: "No reviews found with rating between 9 and 10",
          });
        }
        res.status(200).json(games);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Get the latest reviews
    app.get("/latestReviews", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 5; // Default to 5 if limit is not provide
        const games = await getCollection("ReviewCollection")
          .find({ publishingYear: { $in: ["2024", "2025"] } }) // Filter reviews published in "2024" or "2025"
          .sort({ publishingYear: -1 }) // Sort by publishing year in descending order
          .limit(limit) // Limit the number of results
          .toArray();
        if (!games.length) {
          return res.status(404).json({
            success: false,
            message: "No reviews found with rating between 9 and 10",
          });
        }
        res.status(200).json(games);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    /** Review related CRUD Operation End */

    /** My Review related CRUD Operation Start */
    // Get reviews by reviewer email
    app.get("/myReview/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const reviews = await getCollection("ReviewCollection")
          .find({ reviewerEmail: email })
          .toArray();
        if (!reviews.length) {
          return res.status(404).json({
            success: false,
            message: "No reviews found for this email",
          });
        }
        res.status(200).json(reviews);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Update a review by ID
    app.put("/myReview/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const updateData = req.body;
        const result = await getCollection("ReviewCollection").updateOne(id, {
          $set: updateData,
        });
        if (result.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "No review found or no changes",
          });
        }
        res
          .status(200)
          .json({ success: true, message: "Review update successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Delete a review by ID
    app.delete("/myReview/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const result = await getCollection("ReviewCollection").deleteOne(id);
        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Review not found" });
        }
        res.status(200).json({
          success: true,
          message: "Review deleted successfully to ReviewCollection",
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });
    /** My Review related CRUD Operation End */

    /** My WatchList related CRUD Operation Start */
    // Add a game to the watchlist
    app.post("/watchList", async (req, res) => {
      try {
        const review = req.body;
        if (!review || Object.keys(review).length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid data" });
        }
        const result = await getCollection("WatchListCollection").insertOne(
          review
        );
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Get watchlist items by user email
    app.get("/myWatchList/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const reviews = await getCollection("WatchListCollection")
          .find({ visitor: email })
          .toArray();
        if (!reviews.length) {
          return res.status(404).json({
            success: false,
            message: "No reviews found for this email",
          });
        }
        res.status(200).json(reviews);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Get a single watchlist item by ID
    app.get("/myWatchList/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const review = await getCollection("WatchListCollection").findOne(id);
        if (!review) {
          return res
            .status(404)
            .json({ success: false, message: "Review not found" });
        }
        res.status(200).json(review);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    // Delete a single wathlist item by ID
    app.delete("/myWatchList/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const result = await getCollection("WatchListCollection").deleteOne(id);
        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Review not found" });
        }
        res.status(200).json({
          success: true,
          message: "Review deleted successfully to WatchListCollection",
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    /** My WatchList related CRUD Operation End */

    /** Popular related CRUD Operation Start */
    app.put("/incrementClickCount/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const result = await getCollection("ReviewCollection").updateOne(id, {
          $inc: { clickCount: 1 }, // Increment the clickCount by 1
        });
        if (result.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "No review found or no changes",
          });
        }
        res
          .status(200)
          .json({ success: true, message: "Click count incremented" });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });

    app.get("/popularReviews", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 5; // Default to 5 if limit is not provided
        const reviews = await getCollection("ReviewCollection")
          .find({ clickCount: { $gt: 0 } }) // Filter items with clickCount greater than 0
          .sort({ clickCount: -1 }) // Sort by clickCount in descending order
          .limit(limit) // Limit the number of results
          .toArray();
        if (!reviews.length) {
          return res.status(404).json({
            success: false,
            message: "No reviews found with clicks",
          });
        }
        res.status(200).json(reviews);
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Server error", error });
      }
    });
    /** Popular related CRUD Operation End */

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Data is coming on the server...!");
});

app.listen(port, () => {
  console.log(`Server is running http://localhost:${port}`);
});
