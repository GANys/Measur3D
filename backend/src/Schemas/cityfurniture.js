let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let CityFurnitureGeometry = mongoose.model("Geometry").discriminator(
  "CityFurnitureGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: [
        "MultiPoint",
        "MultiLineString",
        "MultiSurface",
        "CompositeSurface",
        "Solid",
        "CompositeSolid"
      ]
    }
  })
);

let CityFurniture = new mongoose.model("AbstractCityObject").discriminator(
  "CityFurniture",
  new mongoose.Schema({
    type: { type: String, required: true, default: "CityFurniture" },
    geometry: {
      type: [mongoose.model("CityFurnitureGeometry").schema],
      required: true
    }
  })
);

module.exports = {
  insertCityFurniture: async object => {
    var cityfurniture = new CityFurniture(object);

    try {
      let element = await cityfurniture.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: CityFurniture
};
