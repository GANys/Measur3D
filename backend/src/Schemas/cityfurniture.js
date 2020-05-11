let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let CityFurnitureGeometry = mongoose.model("Geometry").discriminator(
  "CityFurnitureGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["MultiPoint", "MultiLineString", "MultiSurface", "CompositeSurface", "Solid", "CompositeSolid"]
    }
  })
);

let CityFurnitureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "CityFurniture" },
  geometry: {
    type: [mongoose.model("CityFurnitureGeometry").schema],
    required: true
  },
  attributes: {}
});

CityFurniture = mongoose.model("CityFurniture", CityFurnitureSchema);

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
  Model: CityFurniture,
  Schema: CityFurnitureSchema
};
