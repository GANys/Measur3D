const mongoose = require("mongoose");
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Data = require("./data");

const rateLimiterUsingThirdParty = require("./rateLimiter");

let Cities = require("./src/Schemas/citymodel.js");

const server = "127.0.0.1:27017"; // REPLACE WITH YOUR DB SERVER
const database = "citymodel"; // REPLACE WITH YOUR DB NAME

const API_PORT = 3001;

const app = express();
app.use(cors());
app.use(compression());
app.use(rateLimiterUsingThirdParty); // Rate-limit on IPs. -> Currently 25 calls/24Hours.
const router = express.Router();

// Limit of file exchanges set to 100 Mb.
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));
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

router.get("/getCityModelsList", (req, res) => {
  mongoose.model("CityModel").find({}, async (err, data) => {
    if (err) {
      return res
        .status(404)
        .send({ error: "There is no CityModels in the DB." });
    }

    var responseCities = [];

    for (var i = 0; i < data.length; ++i ) {
      responseCities.push(data[i].name);
    }

    res.status(200);
    return res.json(responseCities);
  });
});

router.get("/getNamedCityModel", (req, res) => {
  mongoose
    .model("CityModel")
    .find({ name: req.query.name }, async (err, data) => {
      if (err) {
        return res
          .status(500)
          .send({ error: "There is no CityModel with this name in the DB." });
      }

      for (var cityobject in data[0].CityObjects) {
        var cityObjectType = data[0].CityObjects[cityobject].type;
        var cityObjectName = cityobject;

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

        data[0].CityObjects[cityObjectName] = await mongoose // Get CityObjects
          .model(cityObjectType)
          .findById(
            data[0].CityObjects[cityObjectName].id,
            async (err, data_object) => {
              if (err) return res.status(500).send(err);

              return data_object;
            }
          );

        var geometries = [];

        for (var geom in data[0].CityObjects[cityObjectName].geometry) {
          geometries.push(
            await mongoose // Get geometries for the CityObject
              .model("Geometry")
              .findOne(
                { _id: data[0].CityObjects[cityObjectName].geometry[geom] },
                async (err, res_geom) => {
                  if (err) return res.status(500).send(err);

                  return res_geom;
                }
              )
          );
        }

        var max_lod = 0;
        var max_id = -1;

        for (var geom in geometries) {
          // Extract the highest LoD only
          if (geometries[geom].lod > Number(max_lod)) {
            max_lod = Number(geometries[geom].lod);
            max_id = geom;
          }
        }

        data[0].CityObjects[cityObjectName].geometry = [geometries[max_id]];
      }

      res.status(200);
      return res.json(data[0]);
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

      //var attributes = data.attributes;
      var attributes = Object.assign({}, data.attributes); // Copy the CityObject attributes from Schema -> Undefined value if key is empty.

      for (var key in attributes) {
        // Clear the undefined key
        if (attributes[key] == undefined) {
          delete attributes[key];
        }
      }

      if (attributes == null) {
        // If attributes empty, create it
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
        .updateOne({ name: req.body.jsonName }, { attributes }, (err, data) => {
          // Be carefull that object might change has it is not loaded by updateOne
          if (err) return res.status(500).send(err);

          return res.status(200).send({ success: "Object updated." });
        });
    });
});

// append /api for our http requests
app.use("/measur3d", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
