require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const urlParser = require("url")
const dns = require("dns")
const { MongoClient } = require('mongodb');

// Basic Configuration
const port = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());

// include middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// connect to mongoDB Atlas
const client = new MongoClient(MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false });

// create database
const db = client.db("links");

// create collection in database
const urls = db.collection("urls");

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  // get url from request
  const url = req.body.url;

  // check if url is a real url
  const dnsLookup = dns.lookup(urlParser.parse(url).hostname, async (err, add) => {
    if (!add) {
      res.json({ error: "invalid url" })
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount
      }

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({
        original_url: url,
        short_url: urlCount
      });
    }
  })
});

// define endpoint to redirect
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = req.params.short_url;
  const urlDoc = await urls.findOne({short_url: Number(shortUrl)});

  res.redirect(urlDoc.url);
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
