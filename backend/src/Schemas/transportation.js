let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let TransportationGeometry = mongoose.model("Geometry").discriminator(
  "TransportationGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["MultiSurface", "CompositeSurface", "MultiLineString"]
    },
    semantics: {
      surfaces: {
        type: {
          type: String,
          enum: ["TrafficArea", "AuxiliaryTrafficArea"]
        },
        function: {},
        surfaceMaterial: [String]
      },
      values: [Array]
    }
  })
);

let Transportation = mongoose.model("AbstractCityObject").discriminator(
  "Transportation",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Road", "Railway", "TransportSquare"]
    },
    geometry: {
      type: [mongoose.model("TransportationGeometry").schema],
      required: true
    }
  })
);

module.exports = {
  insertTransportation: async object => {
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
