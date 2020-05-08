let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

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

let PlantCoverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "PlantCover" },
  geometry: {
    type: [mongoose.model("PlantCoverGeometry").schema], // type: [mongoose.Schema.Types.ObjectId], if new collections is needed in the future
    required: true
  },
  attributes: {}
});

PlantCover = mongoose.model("PlantCover", PlantCoverSchema);

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
  Model: PlantCover,
  Schema: PlantCoverSchema
};
