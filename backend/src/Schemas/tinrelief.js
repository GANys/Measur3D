let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let TINGeometry = mongoose.model("Geometry").discriminator(
  "TINGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["CompositeSurface"]
    }
  })
);

let TINRelief = new mongoose.model("AbstractCityObject").discriminator(
  "TINRelief",
  new mongoose.Schema({
    type: { type: String, required: true, default: "TINRelief" },
    geographicalExtent: {type: [Number], default: undefined},
    geometry: {
      type: [mongoose.model("TINGeometry").schema],
      required: true
    }
  })
);

module.exports = {
  insertTINRelief: async object => {
    var tinrelief = new TINRelief(object);

    try {
      let element = await tinrelief.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: TINRelief
};
