
//import
const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, CURSOR_FLAGS } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const port = process.env.PORT || 4000
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//middleware
app.use(bodyParser.json())
//app.use(cors())
const corsConfig = {
    origin: true,
    credentials: true,
  }
  app.use(cors(corsConfig))
  app.options('*', cors(corsConfig))


 //get secret key : require('crypto').randomBytes(64).toString('hex')
  function checkJwt(req, res, next) {
    const hederAuth = req.headers.authorization
    if (!hederAuth) {
        return res.status(401).send({ message: 'unauthorized access.try again' })
    }
    else {
        const token = hederAuth.split(' ')[1]
     //   console.log({token});
        jwt.verify(token,process.env.ACCESS_JWT_TOKEN, (err, decoded) => {
            if (err) {
               // console.log(err);
                return res.status(403).send({ message: 'forbidden access' })
            }
        //    console.log('decoded', decoded);
            req.decoded = decoded;
            next()
        })
    }
  //  console.log(hederAuth, 'inside chckjwt');
   
}

//connect to db

const uri = `mongodb+srv://SDP-PROJECT:${process.env.DB_PASS}@cluster0.rt2xfy1.mongodb.net/`

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {

        await client.connect();
        const packageCollection = client.db('crystal-palace').collection('package')
        const ordersCollection = client.db('crystal-palace').collection("ordersCollection");
        const usersCollection = client.db('crystal-palace').collection('users')
        const reviewsCollection = client.db('crystal-palace').collection("reviewsCollection");
        const paymentCollection = client.db('crystal-palace').collection('payment')
        const weddingCollection = client.db('crystal-palace').collection('wedding')
        const holudCollection = client.db('crystal-palace').collection('holud')
        const hindustageCollection = client.db('crystal-palace').collection('hindustage')
        const normalbirthdayCollection = client.db('crystal-palace').collection('normalbirthday')
        const themebirthdayCollection = client.db('crystal-palace').collection('themebirthday')
        const businessCollection = client.db('crystal-palace').collection('business')
        console.log('crystal-palace db');
        const reunionCollection = client.db('crystal-palace').collection('reunion')
        const foodCollection = client.db('crystal-palace').collection('food')
        const photographyCollection = client.db('crystal-palace').collection('photography')
        console.log('crystal-palace db');


        //Verify Admin Role 
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({
                email: requester,
            });
            if (requesterAccount.role === "admin") {
                next();
            } else {
                res.status(403).send({ message: "Forbidden" });
            }
        };
    
        ////API to get all package
        app.get("/package", async (req, res) => {
            const package = await packageCollection.find({}).toArray();
            res.send(package);
        });
        //package add
        app.post('/package',checkJwt,verifyAdmin, async (req, res) => {
            const parts = req.body
            const result =await packageCollection.insertOne(parts)
            res.send(result)
        })
        //update package
        app.put('/package/:id', async (req, res) => {
            const id = req.params.id
            const updateItem = req.body
            console.log(updateItem);
            const query = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    price: updateItem.newUpdatePrice
                }
            }

            const result = await packageCollection.updateOne(query, updateDoc, options)
            res.send(result);
        })
        //single package
        app.get('/package/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const item = await packageCollection.findOne(query)
            res.send(item)
        })
        //post order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })
        //get all order
        app.get("/order", async (req, res) => {
            const orders = await ordersCollection.find({}).toArray();
            res.send(orders);
        });

  //get orders by email 
  app.get('/singleOrder', checkJwt, async (req, res) => {
    const decodedEmail = req.decoded.email
      const email = req.query.email
   //   console.log(email,'email-got');
    if (email === decodedEmail) {
        const query = { email: email }
    const cursor = ordersCollection.find(query)
    const items = await cursor.toArray()
    res.send(items)
    }
    else {
        return res.status(403).send({ message: 'forbidden access' })
    }
   })
  //my order delete 
  app.delete("/myorder/:id", checkJwt, async (req, res) => {
    const decodedEmail = req.decoded.email;
    const id = req.params.id;
    const email = req.headers.email;
    if ( decodedEmail) {
        
      const result =  await ordersCollection.deleteOne({ _id: ObjectId(id) });
        res.send(result);
    } else {
        res.send("Unauthorized access");
    }
});


 //create user
 app.put('/user/:email', async (req, res) => {
    const email = req.params.email;
    const user = req.body
    console.log(user,"user")
    const filter = { email: email }
    const options = { upsert: true }
    const updateDoc = {
        $set: user,
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options)
    const getToken = jwt.sign({ email: email }, process.env.ACCESS_JWT_TOKEN, { expiresIn: '7d' })
    res.send({ result, getToken })
})
        //get user information
        app.get('/user', checkJwt, async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)
        })

     
        //make admin
        app.put('/user/admin/:email', checkJwt,  async (req, res) => {
         
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await usersCollection.updateOne(filter, updateDoc,)
        
            res.send(result)
        
        })
        //API to get user by user email
app.get('/user/:email', checkJwt, async (req, res) => {
    const decodedEmail = req.decoded.email;
    const email = req.params.email;
    // console.log("email", email);
    if (email === decodedEmail) {
        const query = { email: email }
        const cursor = usersCollection.find(query)
        const items = await cursor.toArray()
        res.send(items)
    }
    else {
        // console.log(param);
        return res.status(403).send({ message: 'forbidden access' })

    }
})
        
  //API to get admin 
  app.get("/admin/:email", async (req, res) => {
    const email = req.params.email;
    const user = await usersCollection.findOne({ email: email });
    const isAdmin = user?.role === "admin";
    res.send({ admin: isAdmin });
});

          //API to get all reviews 
          app.get("/reviews", async (req, res) => {
            const reviews = await reviewsCollection.find({}).toArray();
            res.send(reviews);
        });
          //API to get all wedding 
          app.get("/wedding", async (req, res) => {
            const wedding = await weddingCollection.find({}).toArray();
            res.send(wedding);
        });
          //API to get all business
          app.get("/business", async (req, res) => {
            const business = await businessCollection.find({}).toArray();
            res.send(business);
        });
          //API to get all holud
          app.get("/holud", async (req, res) => {
            const holud= await holudCollection.find({}).toArray();
            res.send(holud);
        });
          //API to get all hindustage
          app.get("/hindustage", async (req, res) => {
            const hindustage= await hindustageCollection.find({}).toArray();
            res.send(hindustage);
        });
          //API to get all normalbirthday
          app.get("/normalbirthday", async (req, res) => {
            const normalbirthday= await normalbirthdayCollection.find({}).toArray();
            res.send(normalbirthday);
        });
          //API to get all themebirthday
          app.get("/themebirthday", async (req, res) => {
            const themebirthday= await themebirthdayCollection.find({}).toArray();
            res.send(themebirthday);
        });
          //API to get all reunion
          app.get("/reunion", async (req, res) => {
            const reunion= await reunionCollection.find({}).toArray();
            res.send(reunion);
        });
          //API to get all food
          app.get("/food", async (req, res) => {
            const food= await foodCollection.find({}).toArray();
            res.send(food);
        });
          //API to get all photography
          app.get("/photography", async (req, res) => {
            const photography= await photographyCollection.find({}).toArray();
            res.send(photography);
        });
        //API to post a review 
        app.post('/review', async (req, res) => {
            const newReview = req.body; 
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result)
        })



// give discount 
app.patch('/discount/:email', checkJwt,verifyAdmin ,async (req, res) => {
    const email = req.params.email
   // console.log(email, 'email');
    const giveDiscount = req.body
    //console.log(giveDiscount);
    const query = { email: email }
    const options = { upsert: true };
    const updateDoc = {

        $set: {
          discount: giveDiscount.sendDiscount
        },
    };
    const updateOrder = await usersCollection.updateOne(query, updateDoc,options)
   
    res.send(updateOrder)
})

   //use service
        
 // transiction id
        
 app.post('/create-payment-intent', async (req, res) => {
    const service = req.body
    const price = service.sendPrice
    const amount = price * 100
    const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
})
app.get('/payment/:id',checkJwt, async (req, res) => {
    const id = req.params.id
    const query = { _id: ObjectId(id) }
    const order = await ordersCollection.findOne(query)
    res.send(order)
})


app.patch('/orderPay/:id', checkJwt, async (req, res) => {
    const id = req.params.id
    const payment = req.body
    const filter = { _id: ObjectId(id) }
    const updateDoc = {

        $set: {
            paid: true, 
            transactionId:payment.transactionId
        },
    };
    const updateOrder = await ordersCollection.updateOne(filter, updateDoc)
    const result = await paymentCollection.insertOne(payment)
    res.send(updateOrder)
})

        
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('crystal-palace is connected!')

})

//check 
app.listen(port, () => {
    console.log(`server is running ${port}`)
})