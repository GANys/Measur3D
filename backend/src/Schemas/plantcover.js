let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let PlantCover = new mongoose.model("CityObject").discriminator(
  "PlantCover",
  new mongoose.Schema({
    type: { type: String, required: true, default: "PlantCover" },
    geometry: [mongoose.Schema.Types.Mixed],
    attributes: {
      averageHeight: Number
    }
  })
);

module.exports = {
  insertPlantCover: async (object, jsonName) => {
    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["MultiSolid", "MultiSurface", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.geometry[geometry].type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

    var plantcover = new PlantCover(object);

    try {
      let element = await plantcover.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: PlantCover
};
