let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let Transportation = mongoose.model("CityObject").discriminator(
  "Transportation",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Road", "Railway", "TransportSquare", "Waterway"],
    },
  })
);

module.exports = {
  insertTransportation: (object) => {
    return new Promise(async function (resolve, reject) {
      var temp_geometries = [];

      for (var geometry in object.geometry) {
        var authorised_type = [
          "MultiSurface",
          "CompositeSurface",
          "MultiLineString",
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
        var transportation = new Transportation(
          object
        );

        try {
          transportation.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  Model: Transportation,
};
