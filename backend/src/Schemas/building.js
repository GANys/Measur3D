let mongoose = require("mongoose");

let Geometry = require("./geometry.js");

let Building = new mongoose.Schema({
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
      // ["BuildingRoom", "BuildingStorey", "BuildingUnit"] should not have an address, need to find a solution [HERE]
      CountryName: String,
      LocalityName: String,
      ThoroughfareNumber: Number,
      ThoroughfareName: String,
      PostalCode: String,
      location: {
        type: [Geometry.MultiPoint],
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
  }
);

let BuildingInstallation = new mongoose.Schema({
  geographicalExtent: { type: [Number] },
  parents: { type: [String], required: true },
  attributes: {},
});

module.exports = {
  Building: Building,
  BuildingInstallation: BuildingInstallation,
};
