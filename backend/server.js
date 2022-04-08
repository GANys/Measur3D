const mongoose = require("mongoose");
const express = require("express");
const compression = require("compression");
const url = require("url");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const helmet = require("helmet");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const yaml = require("js-yaml");
var rfs = require("rotating-file-stream"); // version 2.x

const { auth, rateLimiterUsingThirdParty } = require("./middleware");

const server = "127.0.0.1:27017"; // REPLACE WITH YOUR DB SERVER
const database = "citymodel"; // REPLACE WITH YOUR DB NAME

const API_PORT = 3001;

const app = express(); // Middleware order is important
// Security Middleware - low stack - Counters many small attacks type
app.use(helmet());

// Allows server to fecth information from different origins but different ports/API aswell.
app.use(cors()); // Cross-Origin Resource Sharing

// Limit the connection - Counters DDOS
//app.use(rateLimiterUsingThirdParty); // Rate-limit on IPs. -> Currently 1000 calls/24Hours.
// Authentication layer - To be updated to Passport/OID
//app.use(auth);

// Basic compression
app.use(compression());

// Limit of file exchanges set to 100 Mb.
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

//-------------------------------------------------------------------------------------
///// Logging
// create a rotating write stream
var logStream = rfs.createStream("file.log", {
  interval: "3d", // rotate every 3 days
  path: path.join(__dirname, "log"),
});

// log only 4xx and 5xx responses to console
app.use(
  logger("tiny", {
    // Can be "short" for more information
    skip: function (req, res) {
      return res.statusCode < 400;
    },
  })
);

// log all requests to access.log
app.use(
  logger(":date[web] :method :url :status - :response-time ms", {
    stream: logStream,
  })
);
//-------------------------------------------------------------------------------------

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Measur3D",
      version: "0.3.0",
      description: "A light and compact CityJSON management tool",
      license: {
        name: "Apache-2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0",
      },
      contact: {
        name: "Gilles-Antoine Nys",
        email: "ganys@uliege.be",
      },
    },
    servers: [
      {
        url: "http://localhost:3001/measur3d",
        description: "Measur3D RESTful API",
      },
      {
        url: "http://localhost:3001/features",
        description: "OGC API - Features",
      },
    ],
    tags: ["Measur3D", "Features"],
  },
  apis: [
    "./server.js",
    "./routes/measur3d.js",
    "./routes/features.js",
    "./src/Schemas/citymodel.js",
    "./src/Schemas/abstractcityobject.js",
    "./src/Schemas/geometry.js",
    "./src/Schemas/appearance.js",
  ],
};

const specs = swaggerJsdoc(options);

mongoose
  .connect(`mongodb://${server}/${database}`, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    maxPoolSize: 100,
  })
  .then(() => {
    console.log(`Connected to server ${server}/${database} with success.`);
  })
  .catch((err) => {
    console.error(
      `TIMEOUT - Connection to server ${server}/${database} failed.`
    );
  });

let db = mongoose.connection; // Instantiate the connection

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

/**
 * @swagger
 * /api-docs:
 *     get:
 *       summary: Get the full API documentation.
 *       description: The documentation can be queried in YAML or JSON format.
 *       tags: [Measur3D]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [YAML, json]
 *             default: json
 *       responses:
 *         201:
 *           description: Full documentation of the APIs Measur3D and Features.
 */
app.get("/api-docs", (req, res) => {
  var urlParts = url.parse(req.url, true);

  if (null == urlParts.query.f) {
    res.setHeader("Content-Type", "application/json");
    return res.status(201).send(specs);
  } else if ("yaml" == urlParts.query.f) {
    const swaggerSpecYaml = yaml.dump(specs);
    res.setHeader("Content-Type", "text/plain");
    res.status(201).send(swaggerSpecYaml);
  } else if ("json" == urlParts.query.f) {
    res.setHeader("Content-Type", "application/json");
    return res.status(201).send(specs);
  } else res.json(400, { error: "InvalidParameterValue" });
});

// append /api for our http requests
app.use("/measur3d", require("./routes/measur3d"));
app.use("/features", require("./routes/features"));

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
