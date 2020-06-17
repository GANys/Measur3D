let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let CityFurniture = new mongoose.model("CityObject").discriminator(
  "CityFurniture",
  new mongoose.Schema({
    type: { type: String, required: true, default: "CityFurniture" },
    geometry: [mongoose.Schema.Types.Mixed]
  })
);

module.exports = {
  insertCityFurniture: async (object, jsonName) => {
    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["Solid", "MultiSolid", "CompositeSolid", "MultiSurface", "CompositeSurface", "MultiLineString", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry]));
    }

    object.geometry = temp_geometries;

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
