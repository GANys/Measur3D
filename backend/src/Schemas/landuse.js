let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

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

let LandUseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "LandUse" },
  geometry: {
    type: [mongoose.model("LandUseGeometry").schema], // type: [mongoose.Schema.Types.ObjectId], if new collections is needed in the future
    required: true
  },
  attributes: {}
});

LandUse = mongoose.model("LandUse", LandUseSchema);

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
  Model: LandUse,
  Schema: LandUseSchema
};
