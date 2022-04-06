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
    attributes: {
      species: String,
      trunkDiameter: Number,
      crownDiameter: Number,
    },
  })
);

module.exports = {
  insertSolitaryVegetationObject: (object) => {
    return new Promise(async function (resolve, reject) {
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

        temp_geometries.push(
          Geometry.insertGeometry(object.geometry[geometry])
        );
      }

      Promise.all(temp_geometries).then((resolved_geometries) => {
        object.geometry = resolved_geometries;
        var solitaryvegetationobject = new SolitaryVegetationObject(object);

        try {
          solitaryvegetationobject.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  Model: SolitaryVegetationObject,
};
