const mongoose = require("mongoose");
const express = require("express");
const compression = require("compression");
const url = require("url");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const yaml = require("js-yaml");

const rateLimiterUsingThirdParty = require("./rateLimiter");

let Cities = require("./src/Schemas/citymodel.js");
let Functions = require("./util/functions");

const server = "127.0.0.1:27017"; // REPLACE WITH YOUR DB SERVER
const database = "citymodel"; // REPLACE WITH YOUR DB NAME

const API_PORT = 3001;

const app = express();
app.use(cors());
app.use(compression());
app.use(rateLimiterUsingThirdParty); // Rate-limit on IPs. -> Currently 1000 calls/24Hours.

// Limit of file exchanges set to 100 Mb.
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(logger("dev"));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Measur3D",
      version: "0.2.2",
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
    useCreateIndex: true,
    useFindAndModify: false,
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

  console.log(specs)

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
