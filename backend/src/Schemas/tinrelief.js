let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let TINRelief = new mongoose.model("CityObject").discriminator(
  "TINRelief",
  new mongoose.Schema({
    type: { type: String, required: true, default: "TINRelief" },
    geographicalExtent: {type: [Number], default: undefined},
    geometry: [mongoose.Schema.Types.Mixed]
  })
);

module.exports = {
  insertTINRelief: async (object, jsonName) => {
    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["CompositeSurface"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry]));
    }

    object.geometry = temp_geometries;

    var tinrelief = new TINRelief(object);

    try {
      let element = await tinrelief.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: TINRelief
};
