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
          enum: [
            "RoofSurface",
            "GroundSurface",
            "WallSurface",
            "ClosureSurface",
            "OuterCeilingSurface",
            "OuterFloorSurface",
            "Window",
            "Door"
          ]
        }
      },
      values: [Array]
    }
  })
);

let BuildingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["Building", "BuildingPart"],
    default: "Building"
  },
  geographicalExtent: [Number],
  geometry: {
    type: [mongoose.model("BuildingGeometry").schema],
    required: true
  },
  children: [],
  parents: {
    type: [String],
    required: function() {
      return this.type == "BuildingPart";
    }
  },
  attributes: {}
});

let BuildingInstallationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "BuildingInstallation" },
  geographicalExtent: [Number],
  geometry: {
    type: [mongoose.model("Geometry").schema],
    required: true
  },
  parents: { type: [String], required: true },
  attributes: {}
});

Building = mongoose.model("Building", BuildingSchema);
BuildingInstallation = mongoose.model(
  "BuildingInstallation",
  BuildingInstallationSchema
);

module.exports = {
  insertBuilding: async (object, jsonName) => {
    var temp_children = []

    for (var child in object.children) {
      temp_children.push(jsonName + "_" + object.children[child])
    }

    object.children = temp_children

    var temp_parents = []

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent])
    }

    object.parents = temp_parents

    var building = new Building(object);

    try {
      let element = await building.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  insertBuildingInstallation: async (object, jsonName) => {
    var temp_children = []

    for (var child in object.children) {
      temp_children.push(jsonName + "_" + object.children[child])
    }

    object.children = temp_children

    var temp_parents = []

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent])
    }

    object.parents = temp_parents

    var building = new BuildingInstallation(object);

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
