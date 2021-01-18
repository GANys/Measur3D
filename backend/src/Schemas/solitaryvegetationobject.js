let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let SolitaryVegetationObjectGeometry = mongoose.model("Geometry").discriminator(
  "SolitaryVegetationObjectGeometry",
  new mongoose.Schema({
    lod: { required: false },
  })
);

let SolitaryVegetationObject = mongoose.model("CityObject").discriminator(
  "SolitaryVegetationObject",
  new mongoose.Schema({
    type: { type: String, required: true, default: "SolitaryVegetationObject" },
    geometry: [mongoose.Schema.Types.Mixed],
    attributes: {
      species: String,
      trunkDiameter: Number,
      crownDiameter: Number,
    },
  })
);

module.exports = {
  insertSolitaryVegetationObject: async (
    object,
    jsonName
  ) => {
    object["CityModel"] = jsonName;

    /* ATTENTION - Need to be reworked */

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = [
        "Solid",
        "MultiSolid",
        "CompositeSolid",
        "MultiSurface",
        "CompositeSurface",
        "MultiLineString",
        "MultiPoint",
        "GeometryInstance",
      ];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.type + " is not a valid geometry type.");
        return -1;
      }

        temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName)
        );
    }

    object.geometry = temp_geometries;

    var solitaryvegetationobject = new SolitaryVegetationObject(object);

    try {
      let element = await solitaryvegetationobject.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: SolitaryVegetationObject,
};
