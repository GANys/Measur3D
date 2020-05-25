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

let db = mongoose.connection; // Instantiate the connection

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

router.post("/uploadCityModel", (req, res) => {
  Cities.insertCity(req.body).then(function() {
    return res
      .status(201)
      .send({ success: "City model imported with success !" });
  });
});

router.get("/getAllCityModels", (req, res) => {
  mongoose.model("CityModel").find({}, async (err, data) => {
    if (err) {
      return res.status(500).send({ error: "There is no CityModels." });
    }

    for (var citymodel of data) {
      for (var cityobject in citymodel.CityObjects) {

        var cityObjectType = citymodel.CityObjects[cityobject].type;
        var cityObjectName = cityobject

        switch (cityObjectType) {
          case "BuildingPart":
            cityObjectType = "Building";
            break;
          case "Road":
          case "Railway":
          case "TransportSquare":
            cityObjectType = "Transportation";
            break;
          case "TunnelPart":
            cityObjectType = "Tunnel";
            break;
          case "BridgePart":
            cityObjectType = "Bridge";
            break;
          case "BridgeConstructionElement":
            cityObjectType = "BridgeInstallation";
            break;
          default:
        }

        citymodel.CityObjects[cityObjectName] = await mongoose
          .model(cityObjectType)
          .findById(
            citymodel.CityObjects[cityobject].id,
            async (err, data_object) => {
              if (err) return res.status(500).send(err);

              return data_object;
            }
          );
      }
    }

    res.status(200);
    return res.json(data);
  });
});

router.get("/getObject", (req, res) => {
  if (typeof req.query.name != "undefined") {
    mongoose
      .model(req.query.CityObjectClass)
      .find({ name: req.query.name }, (err, data) => {
        if (err) return res.status(500).send(err);
        return res.json(data);
      });
  } else if (typeof req.query.id != "undefined") {
    mongoose
      .model(req.query.CityObjectClass)
      .findById(req.query.id, (err, data) => {
        if (err) return res.status(500).send(err);
        return res.json(data);
      });
  } else {
    return res.status(400).send({
      error:
        "Params are not valid - getObject could not find Object in Collection."
    });
  }
});

router.get("/getObjectAttributes", (req, res) => {
  if (typeof req.query.name != "undefined") {
    mongoose
      .model(req.query.CityObjectClass)
      .findOne({ name: req.query.name }, "attributes", (err, data) => {
        if (err) return res.status(500).send(err);
        return res.json(data);
      });
  } else if (typeof req.query.id != "undefined") {
    mongoose
      .model(req.query.CityObjectClass)
      .findById(req.query.id, "attributes", (err, data) => {
        if (err) return res.status(500).send(err);
        return res.json(data);
      });
  } else {
    return res.status(400).send({
      error:
        "Params are not valid - getObjectAttributes could not find Object in Collection."
    });
  }
});

router.put("/updateObjectAttribute", async (req, res) => {
  mongoose
    .model(req.body.CityObjectClass)
    .findOne({ name: req.body.jsonName }, (err, data) => {
      if (err) return res.status(500).send(err);

      var attributes = data.attributes;

      if (attributes == null) {
        attributes = {};
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
          if (err) return res.status(500).send(err);

          return res.status(200).send({ success: "Object updated." });
        });
    });
});

// append /api for our http requests
app.use("/measur3d", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
