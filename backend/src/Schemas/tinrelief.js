let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let TINGeometry = mongoose.model("Geometry").discriminator(
  "TINGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      default: "CompositeSolid"
    },
    lod: Number
  })
);

let TINReliefSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "TINRelief" },
  geographicalExtent: [Number],
  geometry: {
    type: [mongoose.model("TINGeometry").schema], // type: [mongoose.Schema.Types.ObjectId], if new collections is needed in the future
    required: true
  },
  attributes: {}
});

TINRelief = mongoose.model("TINRelief", TINReliefSchema);

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
  Model: TINRelief,
  Schema: TINReliefSchema
};
