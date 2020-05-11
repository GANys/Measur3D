let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let BridgeGeometry = mongoose.model("Geometry").discriminator(
  "BridgeGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Solid", "CompositeSolid", "MultiSurface"]
    }
  })
);

let BridgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "Bridge" },
  geometry: {
    type: [mongoose.model("BridgeGeometry").schema],
    required: true
  },
  children: [],
  address: {},
  attributes: {}
});

Bridge = mongoose.model("Bridge", BridgeSchema);

module.exports = {
  insertBridge: async object => {
    var bridge = new Bridge(object);

    try {
      let element = await bridge.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Bridge,
  Schema: BridgeSchema
};
