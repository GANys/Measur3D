let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let Transportation = mongoose.model("CityObject").discriminator(
  "Transportation",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Road", "Railway", "TransportSquare"]
    },
    geometry: [mongoose.Schema.Types.Mixed]
  })
);

module.exports = {
  insertTransportation: async (object, jsonName) => {
    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["MultiSurface", "CompositeSurface", "MultiLineString", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.geometry[geometry].type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

    var transportation = new Transportation(object);

    try {
      let element = await transportation.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Transportation
};
