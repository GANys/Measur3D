let mongoose = require("mongoose");

//let CityModel = require("./Schemas/citymodel");
let Cities = require("./Schemas/citymodel");

const server = "127.0.0.1:27017"; // REPLACE WITH YOUR DB SERVER
const database = "citymodel"; // REPLACE WITH YOUR DB NAME

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

var db = mongoose.connection;

var json = require("./generated_model.json");

try {
  Cities.insertCity(json);
} catch (err) {
  console.error(err.message);
}
