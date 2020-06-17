let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let GenericCityObject = new mongoose.model("CityObject").discriminator(
  "GenericCityObject",
  new mongoose.Schema({
    type: { type: String, required: true, default: "GenericCityObject" },
    geometry: [mongoose.Schema.ObjectId]
  })
);

module.exports = {
  insertGenericCityObject: async (object, jsonName) => {
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

    var genericcityobject = new GenericCityObject(object);

    try {
      let element = await genericcityobject.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: GenericCityObject
};
