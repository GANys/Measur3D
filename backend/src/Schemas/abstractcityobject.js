let mongoose = require("mongoose");

let CityObjectSchema = new mongoose.Schema({
  // Generic AbstractCityObject
  name: { type: String, required: true, index: true },
  CityModel: { type: String, required: true, index: true },
  attributes: {
    creationDate: {
      type: String,
      validate: /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/
    },
    terminationDate: {
      type: String,
      validate: /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/
    },
    class: String,
    function: String,
    usage: String
  },
  parents: { type: [String], default: undefined },
  children: { type: [String], default: undefined },
  geographicalExtent: {
    type: [Number],
    default: undefined,
    validate: function() {
      return this["geographicalExtent"].length % 6 == 0;
    }
  },
  geometry: [mongoose.Schema.Types.Mixed],
  vertices: [[Number]]
});

CityObject = mongoose.model("CityObject", CityObjectSchema);

module.exports = {
  Model: CityObject,
  Schema: CityObjectSchema
};
