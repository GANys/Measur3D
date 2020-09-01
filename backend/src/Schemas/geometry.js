/* ----------------------------------------
This file proposes to validate and structure geometry families independently

It is yet not used in Measur3D but can be used in the future.
---------------------------------------- */

let mongoose = require("mongoose");

let GeometrySchema = new mongoose.Schema({
  type: {},
  CityModel: {type: String, index: true},
  CityObject: {type: String, index: true},
  lod: { type: Number, required: true, validate: /([0-3]{1}\.?)+[0-3]?/ },
  boundaries: {},
  semantics: {},
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
  CityModel: String,
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

let SolidGeometry = mongoose.model("Geometry").discriminator(
  "SolidGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: "Solid",
      required: true
    },
    boundaries: { type: [[[[Number]]]], required: true },
    semantics: { surfaces: {type: [], default: undefined}, values: [[Number]] },
    material: {
      visual: {
        values: { type: [[Number]], default: undefined }
      }
    },
    texture: {
      visual: {
        values: { type: [[[[Number]]]], default: undefined }
      }
    }
  })
);

let MultiSolidGeometry = mongoose.model("Geometry").discriminator(
  "MultiSolidGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["MultiSolid", "CompositeSolid"],
      required: true
    },
    boundaries: { type: [[[[[Number]]]]], required: true },
    semantics: { surfaces: {type: [], default: undefined}, values: [[[Number]]] },
    material: {
      visual: {
        values: { type: [[[Number]]], default: undefined }
      }
    },
    texture: {
      visual: {
        values: { type: [[[[[Number]]]]], default: undefined }
      }
    }
  })
);

let MultiSurfaceGeometry = mongoose.model("Geometry").discriminator(
  "MultiSurfaceGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["MultiSurface", "CompositeSurface"],
      required: true
    },
    boundaries: { type: [[[Number]]], required: true },
    semantics: { surfaces: {type: [], default: undefined}, values: [Number] },
    material: {
      visual: {
        values: { type: [Number], default: undefined }
      }
    },
    texture: {
      visual: {
        values: { type: [[[Number]]], default: undefined }
      }
    }
  })
);

let MultiLineStringGeometry = mongoose.model("Geometry").discriminator(
  "MultiLineStringGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: "MultiLineString",
      required: true
    },
    boundaries: { type: [[Number]], required: true }
  })
);

let MultiPointGeometry = mongoose.model("Geometry").discriminator(
  "MultiPointGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: "MultiLineString",
      required: true
    },
    boundaries: { type: [Number], required: true }
  })
);

module.exports = {
  insertGeometry: async (object, jsonName) => {
    object.CityModel = jsonName

    switch (object.type) {
      case "Solid":
        geometry = new SolidGeometry(object);
        break;
      case "MultiSolid":
      case "CompositeSolid":
        geometry = new MultiSolidGeometry(object);
        break;
      case "MultiSurface":
      case "CompositeSurface":
        geometry = new MultiSurfaceGeometry(object);
        break;
      case "MultiLineString":
        geometry = new MultiLineStringGeometry(object);
        break;
      case "MultiPoint":
        geometry = new MultiPointGeometry(object);
        break;
      default:
        throw new Error(object + " does not have a valid geometry type.");
    }

    try {
      let element = await geometry.save();

      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },

  Model: Geometry,
  Schema: GeometrySchema
};
