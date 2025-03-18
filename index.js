require("dotenv").config();
const cors = require("cors");
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;
const app = express();
const port = process.env.PORT || 3000;
console.log(uri)

app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    // await client.connect();
    console.log("Connected to MongoDB successfully!");
    const reviewCollection = client
      .db("ChillGamerDB")
      .collection("ReviewCollection");
    const watchListCollection = client
      .db("ChillGamerDB")
      .collection("WatchListCollection");
    /** Review related CRUD Operation Start */
    //Create a new review
    app.post("/review", async (req, res) => {
      try {
        const review = req.body;
        // Check if review already exists
        const reviewTitle = await reviewCollection.findOne({
          title: review.title,
          reviewerEmail: review.reviewerEmail,
        });
        if (reviewTitle) {
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
        const result = await reviewCollection.insertOne(review);
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

        const totalReviews = await reviewCollection.countDocuments();
        const reviews = await reviewCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();
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
        const review = await reviewCollection.findOne(id);
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

        // Fetch games from the current or previous year
        const games = await reviewCollection
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
        const limit = parseInt(req.query.limit) || 6; // Default to 6 if limit is not provide
        const reviews = await reviewCollection
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
        const limit = parseInt(req.query.limit) || 6; // Default to 6 if limit is not provide
        const reviews = await reviewCollection
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
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 6;
        const skip = (page - 1) * limit;

        const totalReviews = await reviewCollection.countDocuments();
        const reviews = await reviewCollection
          .find({ reviewerEmail: email })
          .skip(skip)
          .limit(limit)
          .toArray();
        if (!reviews.length) {
          return res.status(404).json({
            success: false,
            message: "No reviews found for this email",
          });
        }
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

    // Update a review by ID
    app.put("/myReview/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const updateData = req.body;
        const result = await reviewCollection.updateOne(id, {
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
        const result = await reviewCollection.deleteOne(id);
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
        // Check if review already exists
        const existsReview = await watchListCollection.findOne({
          _id: new ObjectId(review.watchId),
        });
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
        const result = await watchListCollection.insertOne(review);
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
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 6;
        const skip = (page - 1) * limit;

        const totalReviews = await watchListCollection.countDocuments();
        const reviews = await watchListCollection
          .find({ visitor: email })
          .skip(skip)
          .limit(limit)
          .toArray();
        if (!reviews.length) {
          return res.status(404).json({
            success: false,
            message: "No reviews found for this email",
          });
        }
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

    // Get a single watchlist item by ID
    app.get("/myWatchList/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const review = await watchListCollection.findOne(id);
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
        const id = new ObjectId(req.params.id);
        const result = await watchListCollection.deleteOne({ _id: id });
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
        const id = new ObjectId(req.params.id);
        const result = await reviewCollection.updateOne(
          { _id: id },
          {
            $inc: { clickCount: 1 }, // Increment the clickCount by 1
          }
        );
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
        const limit = parseInt(req.query.limit) || 5; // Default to 5 if limit is not provided
        const reviews = await reviewCollection
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
  } catch (error) {
    console.error("MongoDB connection failed!", error);
  }
}

connectDB();

app.get("/", (req, res) => {
  res.send("Chill Gamer project is running...");
});
app.listen(port, () => {
  console.log(`Server is running on: http://localhost:${port}`);
});