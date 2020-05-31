let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let CityObjectGroup = mongoose.model("AbstractCityObject").discriminator(
  "CityObjectGroup",
  new mongoose.Schema({
    type: { type: String, default: "CityObjectGroup" },
    geometry: {
      type: [mongoose.model("Geometry").schema],
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
