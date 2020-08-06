let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let WaterBody = mongoose.model("CityObject").discriminator(
  "WaterBody",
  new mongoose.Schema({
    type: { type: String, required: true, default: "WaterBody" },
    geometry: [mongoose.Schema.Types.Mixed]
  })
);

module.exports = {
  insertWaterBody: async (object, jsonName) => {
    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["Solid", "CompositeSolid", "MultiSurface", "CompositeSurface", "MultiLineString"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry]));
    }

    object.geometry = temp_geometries;

    var waterbody = new WaterBody(object);

    try {
      let element = await waterbody.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: WaterBody
};
