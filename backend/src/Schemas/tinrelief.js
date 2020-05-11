let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

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

let TINReliefSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "TINRelief" },
  geographicalExtent: [Number],
  geometry: {
    type: [mongoose.model("TINGeometry").schema],
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
