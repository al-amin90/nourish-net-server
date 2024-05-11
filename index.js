const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()


// config
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://nourish-net-9ac72.web.app",
        "https://nourish-net-9ac72.firebaseapp.com"
    ],
    credentials: true,

}))
app.use(express.json())
app.use(cookieParser())


// middleware
const tokenVerify = async (req, res, next) => {
    const token = req.cookies.token;
    console.log("verify ", token);
}


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.hjmc0vt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const cookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"? true: false,
    sameSite: process.env.NODE_ENV === "production"? "none": "strict",
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    
    const foodsCollection = client.db("nourishNetDB").collection("foods")
      
// jwt apis
      app.post('/jwt', async (req, res) => {
          const user = req.body;
       
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
          console.log("i am token", token);
          
          res
              .cookie('token', token, cookieOption)
              .send(token)
    })


    //  foods rest apis
    app.get('/foods', async (req, res) => {
        const result = await foodsCollection.find().toArray()

        res.send(result)
    })

    //  post food
    app.post('/foods',tokenVerify, async (req, res) => {
        const food = req.body;
        const token = req.cookies.token;
        console.log(token);
        return
        const result = await foodsCollection.insertOne(food)
        res.send(result)
    })

      


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// --------end part
app.get('/', (req, res) => {
    res.send("nourishNet server running perfectlly...")
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})