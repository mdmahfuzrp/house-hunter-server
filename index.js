const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// MiddleWare
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded.decoded;
        next();
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DATA_USER}:${process.env.DATA_PASS}@cluster0.jlpngjm.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();

        const usersCollection = client.db("houseHunter").collection("allUsers");
        const housesCollection = client.db("houseHunter").collection("houses");
        const bookingsCollection = client.db("houseHunter").collection("allBookings")




        // JWT (JSON WEB TOKEN implement)----------------
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })

        // New User Registration Code -------------------------------
        app.post('/allUsers', async (req, res) => {
            const { fullname, role, phone, email, password } = req.body;
            // Check if the user already exists
            const existingUser = await usersCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Create a new user and save it to the database
            await usersCollection.insertOne({ fullname, role, phone, email, password });

            return res.status(200).json({ message: 'Registration complete' });
        })

        // Login Code -------------------------------
        app.post('/login', async (req, res) => {
            const { email, password } = req.body;
            const user = await usersCollection.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (user.password !== password) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            res.status(200).json({ message: 'Login successful', user });
        })

        // Add House ----------------------------------
        app.post('/houses', async (req, res) => {
            const house = req.body;
            const addNewHouse = await housesCollection.insertOne(house);
            res.send(addNewHouse);
        })

        // All Houses -----------------------
        app.get('/houses', async (req, res) => {
            const page = parseInt(req.query.page);
            const limit = parseInt(req.query.limit);
            const skip = page * limit;
            const query = {}; // Create the query object

            const result = await housesCollection.find(query).skip(skip).limit(limit).toArray();
            res.send(result);
        });

        // Total Houses Count ------------------------
        app.get('/totalHouses', async (req, res) => {
            const result = await housesCollection.estimatedDocumentCount();
            res.send({ totalHouses: result });
        })

        // Find Specific House Using Email ------------------------
        app.get('/houses/email', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = { ownerEmail: req.query.email }
            }
            const result = await housesCollection.find(query).toArray();
            res.send(result);
        })

        // Find Single House --------------------------
        app.get('/houses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await housesCollection.findOne(query);
            res.send(result);
        })

        // Update House
        app.put('/houses/:id', async (req, res) => {
            const houseId = req.params.id;
            const updatedHouse = req.body;
            const filter = { _id: new ObjectId(houseId) };
            const options = { upsert: true };
            const house = {
                $set: {
                    ownerPhone: updatedHouse.ownerPhone,
                    residential: updatedHouse.residential,
                    location: updatedHouse.location,
                    area: updatedHouse.area,
                    title: updatedHouse.title,
                    bedrooms: updatedHouse.bedrooms,
                    bathrooms: updatedHouse.bathrooms,
                    description: updatedHouse.description,
                    picture: updatedHouse.picture,
                    price: updatedHouse.price,
                    availability: updatedHouse.availability,
                    houseOwner: updatedHouse.houseOwner,
                    ownerEmail: updatedHouse.ownerEmail
                }
            }
            const result = await housesCollection.updateOne(filter, house, options);
            res.send(result);
        })

        // Delete Specific House -----------------------
        app.delete('/houses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await housesCollection.deleteOne(query);
            res.send(result);
        })




        // -----------------------------------------
        // House Renter----------------------------
        // -----------------------------------------

        // Get All Bookings -----------------------------------------
        app.get('/allBookings', async (req, res) => {
            const result = await bookingsCollection.find().toArray();
            res.send(result);
        })

        // Add House Bookings ----------------------------------
        app.post('/allBookings', async (req, res) => {
            const bookedHouse = req.body;
            const addNewBookedHouse = await bookingsCollection.insertOne(bookedHouse);
            res.send(addNewBookedHouse);
        })

        // Find All Booked House Using Renter Email ------------------------
        app.get('/allBookings/email', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = { renterEmail: req.query.email }
            }
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        })


        // Find Specific House Using Email ------------------------
        app.get('/allBookings/owner/email', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = { ownerEmail: req.query.email }
            }
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        })

        // Find Bookings House --------------------------
        app.get('/allBookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.findOne(query);
            res.send(result);
        })

        // Delete Specific Bookings -----------------------
        app.delete('/allBookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })









        // Create an API endpoint to handle the house search
        app.post('/searchHouses', async (req, res) => {
            const { bathrooms, bedrooms, location, residential, price, area } = req.body;

            // Build the query based on the search parameters
            const query = {
                $or: [
                    { bathrooms: bathrooms.toString() },
                    { bedrooms: bedrooms.toString() },
                    { location: location.toString() },
                    { residential: residential.toString() },
                    { price: price.toString() },
                    { area: area.toString() },
                ],
            };
            try {
                const searchResults = await housesCollection.find(query).toArray();
                res.json(searchResults);
            } catch (error) {
                console.error('Error searching houses:', error);
                res.status(500).json({ message: 'An error occurred while searching houses.' });
            }
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('House Hunter Running with my Dream Job and 2 night Sleep')
})
app.listen(port, (req, res) => {
    console.log('Server running on port: ', port)
})