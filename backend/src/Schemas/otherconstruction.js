let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let OtherConstruction = new mongoose.model("CityObject").discriminator(
  "OtherConstruction",
  new mongoose.Schema({
    type: { type: String, required: true, default: "OtherConstruction" },
    geometry: [mongoose.Schema.Types.Mixed]
  })
);

module.exports = {
  insertOtherConstruction: async (object, jsonName) => {
    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["MultiSurface", "Solid", "CompositeSolid"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.geometry[geometry].type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

    var otherconstruction = new OtherConstruction(object);

    try {
      let element = await otherconstruction.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: OtherConstruction
};
