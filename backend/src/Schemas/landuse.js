let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let LandUseGeometry = mongoose.model("Geometry").discriminator(
  "LandUseGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["MultiSurface", "CompositeSurface"]
    }
  })
);

let LandUse = new mongoose.model("AbstractCityObject").discriminator(
  "LandUse",
  new mongoose.Schema({
    type: { type: String, required: true, default: "LandUse" },
    geometry: {
      type: [mongoose.model("LandUseGeometry").schema],
      required: true
    }
  })
);

module.exports = {
  insertLandUse: async object => {
    var landuse = new LandUse(object);

    try {
      let element = await landuse.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: LandUse
};
