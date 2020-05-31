let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

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

let Building = mongoose.model("AbstractCityObject").discriminator(
  "Building",
  new mongoose.Schema({
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["Building", "BuildingPart"],
      default: "Building"
    },
    attributes: {
      measuredHeight: Number,
      roofType: String,
      storeysAboveGround: Number,
      storeysBelowGround: Number,
      storeyHeightsAboveGround: { type: [Number], default: undefined },
      storeyHeightsBelowGround: { type: [Number], default: undefined },
      yearOfConstruction: Number,
      yearOfDemolition: Number
    },
    address: {
      CountryName: String,
      LocalityName: String,
      ThoroughfareNumber: Number,
      ThoroughfareName: String,
      PostalCode: String,
      location: {
        type: [mongoose.model("Geometry").schema],
        default: undefined
      }
    },
    parents: {
      type: [String],
      default: undefined,
      required: function() {
        return this.type == "BuildingPart";
      }
    },
    geometry: {
      type: [mongoose.model("BuildingGeometry").schema],
      default: undefined,
      required: true
    }
  })
);

let BuildingInstallation = mongoose.model("AbstractCityObject").discriminator(
  "BuildingInstallation",
  new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, default: "BuildingInstallation" },
    geographicalExtent: { type: [Number], default: undefined },
    geometry: {
      type: [mongoose.model("Geometry").schema],
      default: undefined,
      required: true
    },
    parents: { type: [String], default: undefined, required: true },
    attributes: {}
  })
);

module.exports = {
  insertBuilding: async (object, jsonName) => {
    var temp_children = [];

    for (var child in object.children) {
      temp_children.push(jsonName + "_" + object.children[child]);
    }

    object.children = temp_children;

    var temp_parents = [];

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent]);
    }

    object.parents = temp_parents;

    var building = new Building(object);

    try {
      let element = await building.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  insertBuildingInstallation: async (object, jsonName) => {
    var temp_children = [];

    for (var child in object.children) {
      temp_children.push(jsonName + "_" + object.children[child]);
    }

    object.children = temp_children;

    var temp_parents = [];

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent]);
    }

    object.parents = temp_parents;

    var building = new BuildingInstallation(object);

    try {
      let element = await building.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Building
};
