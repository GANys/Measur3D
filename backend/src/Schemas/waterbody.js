let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let WaterBodyGeometry = mongoose.model("Geometry").discriminator(
  "WaterBodyGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: [
        "MultiLineString",
        "MultiSurface",
        "CompositeSurface",
        "Solid",
        "CompositeSolid"
      ]
    },
    semantics: {
      surfaces: {
        type: {
          type: String,
          enum: ["WaterSurface", "WaterGroundSurface", "WaterClosureSurface"]
        }
      },
      values: { type: [Array], default: undefined }
    }
  })
);

let WaterBody = mongoose.model("AbstractCityObject").discriminator(
  "WaterBody",
  new mongoose.Schema({
    type: { type: String, required: true, default: "WaterBody" },
    geometry: {
      type: [mongoose.model("WaterBodyGeometry").schema],
      required: true
    }
  })
);

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
  Model: WaterBody
};
