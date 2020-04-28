const mongoose = require("mongoose");
const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Data = require("./data");

let Cities = require("./src/Schemas/citymodel.js");
let Building = require("./src/Schemas/building.js");

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

//db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// this is our get method
// this method fetches all available data in our database
router.get("/getData", (req, res) => {
  Data.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// this is our update method
// this method overwrites existing data in our database
router.post("/updateData", (req, res) => {
  const { id, update } = req.body;
  Data.findByIdAndUpdate(id, update, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this is our delete method
// this method removes existing data in our database
router.delete("/deleteData", (req, res) => {
  const { id } = req.body;
  Data.findByIdAndRemove(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// this is our create methid
// this method adds new data in our database
router.post("/putData", (req, res) => {
  let data = new Data();

  const { id, message } = req.body;

  if ((!id && id !== 0) || !message) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  data.message = message;
  data.id = id;
  data.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

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

router.get("/getBuildingObject", (req, res) => {
  if (typeof req.query.name != "undefined") {
    mongoose.model("Building").find({ name: req.query.name }, (err, data) => {
      if (err) return res.json(err);
      return res.json(data);
    });
  }

  if (typeof req.query.id != "undefined") {
    mongoose.model("Building").findById(req.query.id, (err, data) => {
      if (err) return res.json(err);
      return res.json(data);
    });
  }
});

router.get("/getAllBuildingObject", (req, res) => {
  mongoose.model("Building").find({}, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

router.get("/getBuildingAttribute", (req, res) => {
  mongoose
    .model("Building")
    .findOne({ name: req.query.name }, "attributes", (err, data) => {
      if (err) return res.json(err);

      return res.json(data);
    });
});

router.post("/updateBuildingAttribute", async (req, res) => {
  mongoose
    .model("Building")
    .findOne({ name: req.body.jsonName }, (err, data) => {
      if (err) return res.json(err);

      var attributes = data.attributes

      if(req.body.value == "") { // delete
        delete attributes[req.body.key]
      } else if (req.body.old_key) { //update
        delete attributes[req.body.old_key]
        attributes[req.body.key] = req.body.value;
      }
      else { // add
        attributes[req.body.key] = req.body.value;
      }

      mongoose
        .model("Building")
        .update({ name: req.body.jsonName }, {attributes}, (err, data) => {
          if (err) return res.json(err);

          return res.sendStatus(200);
        });
    });
});

/* InserCity - to be linked
try {
  Cities.insertCity(json);
} catch (err) {
  console.error(err.message);
}
*/

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
