let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

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
        surfaceMaterial: {}
      },
      values: [Array]
    }
  })
);

let TransportationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["Road", "Railway", "TransportSquare"]
  },
  geometry: {
    type: [mongoose.model("TransportationGeometry").schema],
    required: true
  },
  attributes: {}
});

Transportation = mongoose.model("Transportation", TransportationSchema);

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
  Model: Transportation,
  Schema: TransportationSchema
};
