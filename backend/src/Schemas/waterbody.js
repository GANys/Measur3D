let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let WaterBodyGeometry = mongoose.model("Geometry").discriminator(
  "WaterBodyGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["MultiLineString", "MultiSurface", "CompositeSurface", "Solid", "CompositeSolid"]
    },
    semantics: {
      surfaces: {
        type: {
          type: String,
          enum: ["WaterSurface", "WaterGroundSurface", "WaterClosureSurface"]
        }
      },
      values: [Array]
    }
  })
);

let WaterBodySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "WaterBody" },
  geometry: {
    type: [mongoose.model("WaterBodyGeometry").schema],
    required: true
  },
  attributes: {}
});

WaterBody = mongoose.model("WaterBody", WaterBodySchema);

module.exports = {
  insertWaterBody: async object => {
    var waterbody = new WaterBody(object);

    try {
      let element = await waterbody.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: WaterBody,
  Schema: WaterBodySchema
};
