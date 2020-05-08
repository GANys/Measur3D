let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let SolitaryVegetationObjectGeometry = mongoose.model("Geometry").discriminator(
  "SolitaryVegetationObjectGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["MultiPoint", "MultiLineString", "MultiSurface", "CompositeSurface", "Solid", "CompositeSolid"]
    }
  })
);

let SolitaryVegetationObjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "SolitaryVegetationObject" },
  geometry: {
    type: [mongoose.model("SolitaryVegetationObjectGeometry").schema], // type: [mongoose.Schema.Types.ObjectId], if new collections is needed in the future
    required: true
  },
  attributes: {}
});

SolitaryVegetationObject = mongoose.model("SolitaryVegetationObject", SolitaryVegetationObjectSchema);

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
  Model: SolitaryVegetationObject,
  Schema: SolitaryVegetationObjectSchema
};
