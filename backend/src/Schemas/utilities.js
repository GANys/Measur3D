let mongoose = require("mongoose");

let GeometrySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["Solid", "CompositeSolid", "MultiSurface"],
    default: "Solid"
  },
  lod: Number,
  boundaries: [[Array]],
  semantics: { surfaces: [Array], values: [Array] }
});

Geometry = mongoose.model("Geometry", GeometrySchema);

module.exports = {
  insertGeometry: object => {
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
