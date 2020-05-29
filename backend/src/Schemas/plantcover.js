let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let PlantCoverGeometry = mongoose.model("Geometry").discriminator(
  "PlantCoverGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["MultiSurface", "MultiSolid"]
    }
  })
);

let PlantCover = new mongoose.model("AbstractCityObject").discriminator(
  "PlantCover",
  new mongoose.Schema({
    type: { type: String, required: true, default: "PlantCover" },
    geometry: {
      type: [mongoose.model("PlantCoverGeometry").schema],
      required: true
    },
    attributes: {
      averageHeight: Number
    }
  })
);

module.exports = {
  insertPlantCover: async object => {
    var plantcover = new PlantCover(object);

    try {
      let element = await plantcover.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: PlantCover
};
