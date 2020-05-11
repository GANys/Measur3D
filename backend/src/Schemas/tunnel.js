let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let TunnelGeometry = mongoose.model("Geometry").discriminator(
  "TunnelGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Solid", "CompositeSolid", "MultiSurface"]
    }
  })
);

let TunnelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "Tunnel" },
  geometry: {
    type: [mongoose.model("TunnelGeometry").schema],
    required: true
  },
  children: [],
  attributes: {}
});

Tunnel = mongoose.model("Tunnel", TunnelSchema);

module.exports = {
  insertTunnel: async object => {
    var tunnel = new Tunnel(object);

    try {
      let element = await tunnel.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Tunnel,
  Schema: TunnelSchema
};
