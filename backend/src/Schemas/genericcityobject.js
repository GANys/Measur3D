let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

let GenericCityObjectGeometry = mongoose.model("Geometry").discriminator(
  "GenericCityObjectGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["MultiPoint", "MultiLineString", "MultiSurface", "CompositeSurface", "Solid", "CompositeSolid"]
    }
  })
);

let GenericCityObjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "GenericCityObject" },
  geometry: {
    type: [mongoose.model("GenericCityObjectGeometry").schema], // type: [mongoose.Schema.Types.ObjectId], if new collections is needed in the future
    required: true
  },
  attributes: {}
});

GenericCityObject = mongoose.model("GenericCityObject", GenericCityObjectSchema);

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
  Model: GenericCityObject,
  Schema: GenericCityObjectSchema
};
