let mongoose = require("mongoose");

var strictModelPlugin = require("./mongoose-strictmodel");

// Generic AbstractCityObject
let CityObjectSchema_alternate = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    attributes: {
      creationDate: {
        type: String,
        validate: /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/,
      },
      terminationDate: {
        type: String,
        validate: /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/,
      },
      class: String,
      function: String,
      usage: String,
    },
    parents: { type: [String], default: undefined },
    children: { type: [String], default: undefined },
    geographicalExtent: {
      type: [Number],
      default: undefined,
      validate: function () {
        return this["geographicalExtent"].length % 6 == 0;
      },
    },
  },
  { collection: "cityobjects" }
);

var CityObjectSchema_alternateStrict = strictModelPlugin(
  CityObjectSchema_alternate
);

CityObjectSchema_alternateStrict.pre("validate", function (next) {
  next();
});

CityObject_alternate = mongoose.model(
  "CityObject_alternate",
  CityObjectSchema_alternateStrict
);

module.exports = {
  Model: CityObject_alternate,
  Schema: CityObjectSchema_alternate,
};

function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return !!pattern.test(str);
}
