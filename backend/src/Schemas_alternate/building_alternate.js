let mongoose = require("mongoose");

let Building_alternate = mongoose.model("CityObject_alternate").discriminator(
  "Building_alternate",
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
    }
  })
);

//var BuildingSchema_alternateStrict = strictModelPlugin(BuildingSchema_alternate);

module.exports = {
  Model: Building_alternate,
};
