let mongoose = require("mongoose");

let GeometrySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "MultiPoint",
      "MultiLineString",
      "MultiSurface",
      "CompositeSurface",
      "Solid",
      "MultiSolid",
      "CompositeSolid",
      "GeometryInstance"
    ], // Often erased. Still saved as documentation
    default: "Solid"
  },
  lod: { type: Number, required: true, validate: /([0-3]{1}\.?)+[0-3]?/ },
  boundaries: { type: [[Array]], required: true },
  semantics: { surfaces: [Array], values: [Array] },
  material: {},
  texture: {}
});

Geometry = mongoose.model("Geometry", GeometrySchema);

module.exports = {
  insertGeometry: async object => {
    var geometry = new Geometry(object);

    geometry.save(function(err, element) {
      if (err) return console.log(err.message);

      return element.id;
      // saved!
    });
  },

  Model: Geometry,

  Schema: GeometrySchema
};
