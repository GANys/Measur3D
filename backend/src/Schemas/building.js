let mongoose = require("mongoose");

let Geometry = require("./geometry.js");

let Building = mongoose.model("CityObject").discriminator(
  "Building",
  new mongoose.Schema({
    type: {
      type: String,
      enum: [
        "Building",
        "BuildingPart",
        "BuildingRoom",
        "BuildingStorey",
        "BuildingUnit",
      ],
      default: "Building",
    },
    attributes: {
      measuredHeight: Number,
      roofType: String,
      storeysAboveGround: Number,
      storeysBelowGround: Number,
      storeyHeightsAboveGround: { type: [Number], default: undefined },
      storeyHeightsBelowGround: { type: [Number], default: undefined },
      yearOfConstruction: Number,
      yearOfDemolition: Number,
    },
    address: {
      CountryName: String,
      LocalityName: String,
      ThoroughfareNumber: Number,
      ThoroughfareName: String,
      PostalCode: String,
      location: {
        type: [], // MultiPoint
        default: undefined,
      },
    },
    parents: {
      type: [String],
      default: undefined,
      required: function () {
        return [
          "BuildingPart",
          "BuildingRoom",
          "BuildingStorey",
          "BuildingUnit",
        ].includes(this.type);
      },
    },
    geometry: [mongoose.Schema.Types.ObjectId],
  })
);

let BuildingInstallation = mongoose.model("CityObject").discriminator(
  "BuildingInstallation",
  new mongoose.Schema({
    type: {
      type: String,
      enum: [
        "BuildingInstallation",
        "BuildingConstructiveElement",
        "BuildingFurniture",
      ],
      default: "BuildingInstallation",
    },
    geographicalExtent: { type: [Number], default: undefined },
    parents: { type: [String], default: undefined, required: true },
    attributes: {},
  })
);

module.exports = {
  insertBuilding: (object) => {
    return new Promise(async function (resolve, reject) {
      var temp_geometries = [];

      for (var geometry in object.geometry) {
        var authorised_type = ["Solid", "CompositeSolid", "MultiSurface"];
        if (!authorised_type.includes(object.geometry[geometry].type)) {
          throw new Error(object.type + " is not a valid geometry type.");
          return;
        }

        temp_geometries.push(
          Geometry.insertGeometry(object.geometry[geometry])
        );
      }

      Promise.all(temp_geometries).then((resolved_geometries) => {
        object.geometry = resolved_geometries;
        var building = new Building(object);

        try {
          building.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  insertBuildingInstallation: (object) => {
    return new Promise(async function (resolve, reject) {
      var temp_geometries = [];

      for (var geometry in object.geometry) {
        var authorised_type = [
          "Solid",
          "MultiSolid",
          "CompositeSolid",
          "MultiSurface",
          "CompositeSurface",
          "MultiLineString",
          "MultiPoint",
        ];
        if (!authorised_type.includes(object.geometry[geometry].type)) {
          throw new Error(object.type + " is not a valid geometry type.");
          return;
        }

        temp_geometries.push(
          Geometry.insertGeometry(object.geometry[geometry])
        );
      }

      Promise.all(temp_geometries).then((resolved_geometries) => {
        object.geometry = resolved_geometries;
        var building = new BuildingInstallation(object);

        try {
          building.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  Model: Building,
};
