const mongoose = require("mongoose");
const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Data = require("./data");

let Cities = require("./src/Schemas/citymodel.js");

const server = "127.0.0.1:27017"; // REPLACE WITH YOUR DB SERVER
const database = "citymodel"; // REPLACE WITH YOUR DB NAME

const API_PORT = 3001;
const app = express();
app.use(cors());
const router = express.Router();

// Limit of file exchanges set to 50 Mb.
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(logger("dev"));

mongoose
  .connect(`mongodb://${server}/${database}`, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log(`Connected to server ${server}/${database} with success.`);
  })
  .catch(err => {
    console.error(
      `TIMEOUT - Connection to server ${server}/${database} failed.`
    );
  });

let db = mongoose.connection;

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

router.post("/putCityModel", (req, res) => {
  Cities.insertCity(req.body).then(function() {
    return res.sendStatus(200);
  });
});

router.get("/getAllCityModelObject", (req, res) => {
  mongoose.model("CityModel").find({}, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

router.get("/getObject", (req, res) => {
  if (typeof req.query.name != "undefined") {
    mongoose.model(req.query.CityObjectClass).find({ name: req.query.name }, (err, data) => {
      if (err) return res.json(err);
      return res.json(data);
    });
  }

  if (typeof req.query.id != "undefined") {
    mongoose.model(req.query.CityObjectClass).findById(req.query.id, (err, data) => {
      if (err) return res.json(err);
      return res.json(data);
    });
  }
});

router.get("/getObjectAttribute", (req, res) => {
  mongoose
    .model(req.query.CityObjectClass)
    .findOne({ name: req.query.name }, "attributes", (err, data) => {
      if (err) return res.json(err);

      return res.json(data);
    });
});

router.post("/updateObjectAttribute", async (req, res) => {
  mongoose
    .model(req.body.CityObjectClass)
    .findOne({ name: req.body.jsonName }, (err, data) => {
      if (err) return res.json(err);

      var attributes = data.attributes;

      if (attributes == null) {
        attributes = {}
      }

      if (req.body.value == "") {
        // delete
        delete attributes[req.body.key];
      } else if (req.body.old_key) {
        //update
        delete attributes[req.body.old_key];
        attributes[req.body.key] = req.body.value;
      } else {
        // add
        attributes[req.body.key] = req.body.value;
      }

      mongoose
        .model(req.body.CityObjectClass)
        .update({ name: req.body.jsonName }, { attributes }, (err, data) => {
          if (err) return res.json(err);

          return res.sendStatus(200);
        });
    });
});

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
