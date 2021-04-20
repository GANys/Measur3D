let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let LandUse = new mongoose.model("CityObject").discriminator(
  "LandUse",
  new mongoose.Schema({
    type: { type: String, required: true, default: "LandUse" },
    geometry: [mongoose.Schema.Types.Mixed]
  })
);

module.exports = {
  insertLandUse: async (object, jsonName) => {
    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["MultiSurface", "CompositeSurface", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.geometry[geometry].type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

    var landuse = new LandUse(object);

    try {
      let element = await landuse.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: LandUse
};
