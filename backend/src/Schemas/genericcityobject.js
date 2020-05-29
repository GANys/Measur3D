let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let GenericCityObjectGeometry = mongoose.model("Geometry").discriminator(
  "GenericCityObjectGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: [
        "MultiPoint",
        "MultiLineString",
        "MultiSurface",
        "CompositeSurface",
        "Solid",
        "CompositeSolid"
      ]
    }
  })
);

let GenericCityObject = new mongoose.model("AbstractCityObject").discriminator(
  "GenericCityObject",
  new mongoose.Schema({
    type: { type: String, required: true, default: "GenericCityObject" },
    geometry: {
      type: [mongoose.model("GenericCityObjectGeometry").schema],
      required: true
    }
  })
);

module.exports = {
  insertGenericCityObject: async object => {
    var genericcityobject = new GenericCityObject(object);

    try {
      let element = await genericcityobject.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: GenericCityObject
};
