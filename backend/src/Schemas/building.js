let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let BuildingGeometry = mongoose.model("Geometry").discriminator(
  "BuildingGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Solid", "CompositeSolid", "MultiSurface"]
    },
    semantics: {
      surfaces: {
        type: {
          type: String,
          enum: ["RoofSurface", "GroundSurface", "WallSurface", "ClosureSurface", "OuterCeilingSurface", "OuterFloorSurface", "Window", "Door"]
        }
      },
      values: [Array]
    }
  })
);

let BuildingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "Building" },
  geographicalExtent: [Number],
  geometry: {
    type: [mongoose.model("BuildingGeometry").schema], // type: [mongoose.Schema.Types.ObjectId], if new collections is needed in the future
    required: true
  },
  children: [],
  attributes: {}
});

Building = mongoose.model("Building", BuildingSchema);

module.exports = {
  insertBuilding: async object => {
    var building = new Building(object);

    try {
      let element = await building.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Building,
  Schema: BuildingSchema
};
