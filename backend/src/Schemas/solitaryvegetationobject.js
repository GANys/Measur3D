let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let SolitaryVegetationObjectGeometry = mongoose.model("Geometry").discriminator(
  "SolitaryVegetationObjectGeometry",
  new mongoose.Schema({
    lod: { required: false }
  })
);

let SolitaryVegetationObject = mongoose.model("AbstractCityObject").discriminator(
  "SolitaryVegetationObject",
  new mongoose.Schema({
    type: { type: String, required: true, default: "SolitaryVegetationObject" },
    geometry: {
      type: [mongoose.model("SolitaryVegetationObjectGeometry").schema],
      required: false
    },
    attributes: {
      species: String,
      trunkDiameter: Number,
      crownDiameter: Number
    }
  })
);

module.exports = {
  insertSolitaryVegetationObject: async object => {
    var solitaryvegetationobject = new SolitaryVegetationObject(object);

    try {
      let element = await solitaryvegetationobject.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: SolitaryVegetationObject
};
