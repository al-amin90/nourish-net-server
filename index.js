const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.hjmc0vt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middleware
const tokenVerify = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).send("unAuthorize user")
    }
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
             return res.status(401).send("unAuthorize user")
        }

        req.user = decoded;
        next()
    })
}


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
          
          res
              .cookie('token', token, cookieOption)
              .send({success: true})
      })
    
    // jwt logout
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log("log out user", user);

      res
        .clearCookie('token', {...cookieOption,maxAge: 0})
        .send({ success: true })
    })

       //  foods rest apis in home page
      app.get('/foodsAcc', async (req, res) => {
        const query = {statusFood: "available"}
        const result = await foodsCollection.find(query).sort({foodQuantity: -1}).toArray()

        res.send(result)
    })


    //  foods rest apis
    app.get('/foods', async (req, res) => {
      const available = req.query.avi;
      const sort = req.query.sort;
      const search = req.query.search;
      

      let query = {
        foodName: {$regex: search, $options: "i"},
      }
      let options = {}

      if (available) {
        query.statusFood = available
      }
      if(sort) {
        options = {sort: {expiredDate: sort === "Ascending Order" ? 1 : -1}}
      }
      
        const result = await foodsCollection.find(query,options).toArray()
        res.send(result)
    })
    
    // get single food
    app.get('/food/:id', tokenVerify, async (req, res) => {
      const id = req.params.id;

      const result = await foodsCollection.findOne({ _id: new ObjectId(id) })
      res.send(result)
    })

    // add food manage
      app.get('/foodss', tokenVerify, async (req, res) => {
        let query = {}
        const request = req.query.requ;
        console.log(request);

        const user = req.user.email;
        const email = req.query.email;

        // verifying-------
        if (email !== user) {
            return res.status(403).send('Forbidden Access')
        }
        
        if (request) {
          query.statusFood = request;
          query['userEmail'] = email;
        }
        else {
          query = { 'donateUser.email': email }
        }
      
          
          const result = await foodsCollection.find(query).toArray()
          res.send(result)
      })
      
    //  post food
    app.post('/foods',tokenVerify, async (req, res) => {  
        const food = req.body;
      const token = req.cookies.token;

      const result = await foodsCollection.insertOne(food)
      res.send(result)
    })

    // update food
    app.put('/food/:id', tokenVerify, async (req, res) => {
      const id = req.params.id;
      const food = req.body;

      const options = {upsert: true}
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          ...food
        }
      }
      const result = await foodsCollection.updateOne(filter, updateDoc,options);
      res.send(result)
    })
      
    // delete single food
    app.delete('/food/:id', tokenVerify, async (req, res) => {
      const id = req.params.id;

      const result = await foodsCollection.deleteOne({ _id: new ObjectId(id) })
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