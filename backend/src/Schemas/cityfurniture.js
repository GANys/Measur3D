let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let CityFurniture = new mongoose.model("CityObject").discriminator(
  "CityFurniture",
  new mongoose.Schema({
    type: { type: String, required: true, default: "CityFurniture" },
  })
);

module.exports = {
  insertCityFurniture: (object) => {
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
        ];
        if (!authorised_type.includes(object.geometry[geometry].type)) {
          throw new Error(object.type + " is not a valid geometry type.");
          return;
        }

        temp_geometries.push(
          Geometry.insertGeometry(object.geometry[geometry])
        );
      }

      Promise.all(temp_geometries).then((resolved_geometries) => {
        object.geometry = resolved_geometries;
        var cityfurniture = new CityFurniture(object);

        try {
          cityfurniture.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  Model: CityFurniture,
};
