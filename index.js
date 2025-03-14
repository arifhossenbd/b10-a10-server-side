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
let client;
let db;

async function connectionToDatabase() {
  if (client && client.topology && client.topology.isConnected()) {
    return db;
  }

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    db = client.db("ChillGamerDB");
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Couldn't connect to MongoDB", error);
    throw error;
  }
}

// Helper function to get a collection by name
const getCollection = async (collectionName) => {
  const db = await connectionToDatabase();
  const collection = await db.collection(collectionName);
  return collection;
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await connectionToDatabase();

    /** Review related CRUD Operation Start */
    //Create a new review
    app.post("/review", async (req, res) => {
      try {
        const review = req.body;
        const collection = await getCollection("ReviewCollection");
        // Check if review already exists
        const reviewTitle = await collection.findOne({
          title: review.title,
        });
        const existsReview = reviewTitle?.title === review?.title;
        if (existsReview) {
          return res
            .status(409)
            .json({ success: false, message: "Already exists this review" });
        }
        // Validating the incoming data
        if (!review || Object.keys(review).length === 0) {
          console.log(Object.keys(review));
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Retrieve all reviews
    app.get("/reviews", async (req, res) => {
      try {
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 6;
        const skip = (page - 1) * limit;

        const collection = await getCollection("ReviewCollection");
        const totalReviews = await collection.countDocuments();
        const reviews = await collection.find().skip(skip).limit(limit).toArray();
        res.status(200).json({
          data: reviews,
          currentPage: page,
          totalPage: Math.ceil(totalReviews / limit),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Find single single by id
    app.get("/review/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const collection = await getCollection("ReviewCollection");
        const review = await collection.findOne(id);
        if (!review) {
          return res
            .status(404)
            .json({ success: false, message: "Review not found" });
        }
        res.status(200).json(review);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Get the latest games
    app.get("/latestGames", async (req, res) => {
      try {
        const date = new Date();
        const currentYear = date.getFullYear();
        const limit = parseInt(req.query.limit) || 6; // Default to 6 if limit is not provide

        const collection = await getCollection("ReviewCollection");
        // Fetch games from the current or previous year
        const games = await collection
          .find({
            $or: [
              { publishingYear: `${currentYear}` }, // Current year
              { publishingYear: `${currentYear - 1}` }, // Previous year
            ],
          })
          .sort({ publishingYear: -1 }) // Sort by publishing year in descending order
          .limit(limit) // Limit the number of results
          .toArray();

        // If no games found return a 404 error
        if (games.length === 0) {
          return res.status(404).json({
            success: false,
            message: "No games found for the current or previous year.",
          });
        }
        res.status(200).json(games);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Get the latest reviews
    app.get("/latestReviews", async (req, res) => {
      try {
        const collection = await getCollection("ReviewCollection");
        const limit = parseInt(req.query.limit) || 6; // Default to 6 if limit is not provide
        const reviews = await collection
          .find()
          .sort({ timeStamp: -1 }) // Sort by latest reviews in descending order
          .limit(limit) // Limit the number of results
          .toArray();
        if (!reviews.length) {
          return res.status(404).json({
            success: false,
            message: "Latest reviews not found.",
          });
        }
        res.status(200).json(reviews);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Get the top reviews
    app.get("/topRatedReviews", async (req, res) => {
      try {
        const collection = await getCollection("ReviewCollection");
        const limit = parseInt(req.query.limit) || 6; // Default to 6 if limit is not provide
        const reviews = await collection
          .find({ rating: { $in: ["10"] } }) // Filter reviews rating 10;
          .sort({ rating: -1 }) // Sort by latest reviews in descending order
          .limit(limit) // Limit the number of results
          .toArray();
        if (!reviews.length) {
          return res.status(404).json({
            success: false,
            message: "Top rated reviews not found",
          });
        }
        res.status(200).json(reviews);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    /** Review related CRUD Operation End */

    /** My Review related CRUD Operation Start */
    // Get reviews by reviewer email
    app.get("/myReview", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({
            success: false,
            message: "Email query parameter is required",
          });
        }
        const collection = await getCollection("ReviewCollection");
        const reviews = await collection
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Update a review by ID
    app.put("/myReview/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const updateData = req.body;
        const collection = await getCollection("ReviewCollection");
        const result = await collection.updateOne(id, {
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Delete a review by ID
    app.delete("/myReview/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const collection = await getCollection("ReviewCollection");
        const result = await collection.deleteOne(id);
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });
    /** My Review related CRUD Operation End */

    /** My WatchList related CRUD Operation Start */
    // Add a game to the watchlist
    app.post("/watchList", async (req, res) => {
      try {
        const review = req.body;
        const collection = await getCollection("WatchListCollection");
        // Check if review already exists
        const id = await collection.findOne({
          _id: review._id,
        });
        const existsReview = id?._id === review?.watchId;
        if (existsReview) {
          return res.status(409).json({
            success: false,
            message: "This review already exists in Watch List",
          });
        }
        if (!review || Object.keys(review).length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid data" });
        }
        const result = await collection.insertOne(
          review
        );
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Get watchlist items by user email
    app.get("/myWatchList", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({
            success: false,
            message: "Email query parameter is required",
          });
        }
        const watchCollection = await getCollection("WatchListCollection");
        const reviews = await watchCollection
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Get a single watchlist item by ID
    app.get("/myWatchList/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const watchCollection = await getCollection("WatchListCollection");
        const review = await watchCollection.findOne(id);
        if (!review) {
          return res
            .status(404)
            .json({ success: false, message: "Review not found" });
        }
        res.status(200).json(review);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    // Delete a single wathlist item by ID
    app.delete("/myWatchList/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const watchCollection = await getCollection("WatchListCollection");
        const result = await watchCollection.deleteOne(id);
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });
    /** My WatchList related CRUD Operation End */

    /** Popular related CRUD Operation Start */
    app.put("/incrementClickCount/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) }; 
        const collection = await getCollection("ReviewCollection");
        const result = await collection.updateOne(id, {
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      }
    });

    app.get("/popularReviews", async (req, res) => {
      try {
        const collection = await getCollection("ReviewCollection");
        const limit = parseInt(req.query.limit) || 5; // Default to 5 if limit is not provided
        const reviews = await collection
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
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
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
