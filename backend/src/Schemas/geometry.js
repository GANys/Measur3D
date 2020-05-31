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
  semantics: {
    surfaces: { type: [Array], default: undefined },
    values: { type: [Array], default: undefined }
  },
  material: {},
  texture: {}
});

let GeometryInstanceSchema = new mongoose.Schema({
  // Different but the same
  type: {
    type: String,
    required: true,
    default: "GeometryInstance"
  },
  template: {
    type: Number
  },
  boundaries: {
    type: [[Array]],
    required: true
  },
  transformationMatrix: {
    type: [Number],
    required: true,
    validate: function() {
      return this["transformationMatrix"].length % 16 == 0;
    }
  }
});

GeometryInstance = mongoose.model("GeometryInstance", GeometryInstanceSchema);
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
