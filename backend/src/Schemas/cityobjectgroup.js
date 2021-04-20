let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let CityObjectGroup = mongoose.model("CityObject").discriminator(
  "CityObjectGroup",
  new mongoose.Schema({
    type: { type: String, default: "CityObjectGroup" },
    geometry: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
      required: function() {
        return this.geometry.length <= 1;
      }
    },
    members: {
      type: [String],
      required: true
    },
  })
);

module.exports = {
  insertCityObjectGroup: async (object, jsonName) => {
    var temp_members = [];

    for (var member in object.members) {
      temp_members.push(jsonName + "_" + object.members[member]);
    }

    object.members = temp_members;

    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["Solid", "MultiSolid", "CompositeSolid", "MultiSurface", "CompositeSurface", "MultiLineString", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.geometry[geometry].type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

    var cityobjectgroup = new CityObjectGroup(object);

    try {
      let element = await cityobjectgroup.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: CityObjectGroup
};
