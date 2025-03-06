require('dotenv').config()
const cors = require('cors');
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const chillGamer = client.db('ChillGamerDB');
const getCollection = (collectionName) => {
  const collection = chillGamer.collection(collectionName);
  return collection;
}
/** Reusable Crud Operation Function */
const crudOperation = async (operation, collectionName, data = {}, filter = {}) => {
  try {
    const collection = getCollection(collectionName);

    //If _id then convert will be ObjectId
    if (filter && filter._id) {
      try {
        filter._id = new ObjectId(filter._id);
      } catch (error) {
        return { success: false, message: "Invalid ObjectId format", error }
      }
    }
    let result;
    switch (operation) {
      case "create":
        result = await collection.insertOne(data);
        return { success: true, message: `Data inserted successfully in the ${collectionName}`, insertedId: result?.insertedId };
      case "read":
        result = await collection.find(filter).toArray();
        if (!result) return { success: false, message: `This data not found in ${collectionName}` }
        return { success: true, message: `Data retrieved successfully to the ${collectionName}`, data: result };
      case "readOne":
        result = await collection.findOne(filter);
        return { success: true, message: `Data retrieved successfully by id to the ${collectionName}`, data: result };

      /** Update full document */
      case "update":
        result = await collection.updateOne(filter, { $set: data });
        if (result?.modifiedCount === 0) return { success: false, message: "Data not updated" }
        return { success: true, message: `Data updated successfully by id to the ${collectionName}`, modifiedCount: result?.modifiedCount };

      /** Update partial */
      case "patch":
        result = await collection.updateOne(filter, { $set: data });
        if (result?.modifiedCount === 0) return { success: false, message: "Data not updated" }
        return { success: true, message: `Data patched successfully by id to the ${collectionName}`, modifiedCount: result?.modifiedCount };
      case "delete":
        result = await collection.deleteOne(filter);
        if (result?.deletedCount === 0) return { success: false, message: "Data not deleted" }
        return { success: true, message: `Data deleted successfully by id to the ${collectionName}`, modifiedCount: result?.modifiedCount };
      default: return { success: false, message: "Invalid operation" }
    }
  } catch (error) {
    console.error("Database error", error);
    return { success: false, message: "Database operation failed", error };
  }
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    /** Review related CRUD Operation Start */
    //Create a new review
    app.post("/review", async(req, res) => {
      const result = await crudOperation("create", "ReviewCollection", req.body);
      res.status(result.success ? 200 : 400).json(result);
    });

    // Retrieve data by use get
    app.get("/reviews", async(req, res) => {
      const result = await crudOperation("read", "ReviewCollection");
      res.status(result.success ? 200 : 400).json(result);
    })

    // Get specific data by id
    app.get("/review/:id", async(req, res) => {
      const result = await crudOperation("readOne", "ReviewCollection", {_id: req.params.id});
      res.status(result.success ? 200 : 400).json(result);
    })

    // Update specific data by id
    app.put("/review/:id", async(req, res) => {
      const filter = {_id: new ObjectId(req.params.id)};
      const result = await crudOperation("update", "ReviewCollection", req.body, filter);
      res.status(result.success ? 200 : 400).json(result);
    })

    // Delete specific data by id
    app.delete("/review/:id", async(req, res) => {
      const filter = {_id: new ObjectId(req.params.id)};
      const result = await crudOperation("delete", "ReviewCollection", req.body, filter);
      res.status(result.success ? 200 : 400).json(result);
    })
    /** Review related CRUD Operation End */

    /** WatchList related CRUD Operation Start */
    app.post("/watchList", async(req, res) => {
      const result = await crudOperation("create", "WatchListCollection", req.body);
      res.status(result.success ? 200 : 400).json(result);
    });
    /** WatchList related CRUD Operation End */

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Data is coming on the server...!")
})

app.listen(port, () => {
  console.log(`Server is running http://localhost:${port}`)
})