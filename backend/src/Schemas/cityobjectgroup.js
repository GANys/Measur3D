let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let CityObjectGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "CityObjectGroup" },
  geometry: {
    type: [mongoose.model("Geometry").schema],
    required: function() {
      return this.geometry.length <= 1;
    }
  },
  members: [],
  attributes: {}
});

CityObjectGroup = mongoose.model("CityObjectGroup", CityObjectGroupSchema);

module.exports = {
  insertCityObjectGroup: async (object, jsonName) => {
    var temp_members = []

    for (var member in object.members) {
      temp_members.push(jsonName + "_" + object.members[member])
    }

    object.members = temp_members

    var cityobjectgroup = new CityObjectGroup(object);

    try {
      let element = await cityobjectgroup.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: CityObjectGroup,
  Schema: CityObjectGroupSchema
};
