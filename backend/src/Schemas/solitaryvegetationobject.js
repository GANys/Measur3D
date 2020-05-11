let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let SolitaryVegetationObjectGeometry = mongoose.model("Geometry").discriminator(
  "SolitaryVegetationObjectGeometry",
  new mongoose.Schema({
    lod: {required: false}
  })
);

let SolitaryVegetationObjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "SolitaryVegetationObject" },
  geometry: {
    type: [mongoose.model("SolitaryVegetationObjectGeometry").schema],
    required: false
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
