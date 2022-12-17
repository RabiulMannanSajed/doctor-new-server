const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;
// middel tier
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1gtxgrj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

console.log(uri);

async function run() {

    try {
        /// here data base is connected 
        await client.connect();
        // console.log("connected Data base");
        const servicesCollection = client.db('doctor_new').collection('services');
        const bookingCollection = client.db('doctor_new').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date || 'May 11, 2022';
            // const date = req.query.date;

            // Step 1 : get all services
            const services = await servicesCollection.find().toArray();

            // step 2 : get the booking of that day
            const query = { date: date };
            const bookings = await bookingCollection.find().toArray();

            services.forEach(service => {
                const serviceBookings = bookings.filter(b => b.treatment === service.name);
                const booked = serviceBookings.map(s => s.slot);
                const available = service.slots.filter(s => !booked.includes(s));
                service.available = available;
                service.booked = serviceBookings.map(s => s.slot);
                // service.booked = '08.00 AM - 08.30 AM'
            })
            res.send(bookings);
        })

        // for testing
        app.get('/someBooking', async (req, res) => {
            const date = req.query.date;
            const query = { date: date };
            const booking = await bookingCollection.find(query).toArray();

            res.send(booking);
        })
        /**
         * Api naming Convention
         * app.get('/booking') //get all booking
         * app.get('/booking/:id') //get specific booking
         * app.post('/booking') //add a new booking
         * add.patch('/booking/:id') // specific one updating 
         * add.delete('/booking/:id') // specific one delete
         */

        // Here add a new booking to the server site 
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            ///here checking client can't take multi appointment in same date cause we checking  the data here 
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            console.log(result);
            return res.send({ success: true, result });
        })

    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World Doctor site!')
})

app.listen(port, () => {
    console.log(`Doctor server ${port}`)
})

