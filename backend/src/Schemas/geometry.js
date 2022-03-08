/* ----------------------------------------
This file proposes to validate and structure geometry families independently
---------------------------------------- */

/**
 *  @swagger
 *   components:
 *     schemas:
 *       Geometry:
 *         type: object
 *         required:
 *           - type
 *           - CityModel
 *           - CityObject
 *           - lod
 *           - boundaries
 *         properties:
 *           type:
 *             type: string
 *             format: ISO 19107
 *             description: Geometric primitives that are non-decomposed objects presenting information about geometric configuration.
 *           CityModel:
 *             type: string
 *             description: Reference to the parent CityModel - created by the method '#/Measur3D/uploadCityModel'.
 *           CityObject:
 *             type: string
 *             description: Reference to the parent CityObject - created by the method '#/Measur3D/uploadCityModel'.
 *           lod:
 *             type: number
 *             description: A number identifying the level-of-detail.
 *           boundaries:
 *             description: A hierarchy of arrays (the depth depends on the Geometry object) with integers. An integer refers to the index in the "vertices" array of the referenced CityObject (0-based).
 *             type: array
 *             items:
 *               type: number
 *           semantics:
 *             description: A JSON object representing the semantics of a surface, and may also represent other attributes of the surface.
 *             type: object
 *             properties:
 *               surfaces:
 *                 description: An array of Semantic Surface Objects
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Type of the object.
 *                     parent:
 *                       type: number
 *                       description: An integer pointing to another Semantic Object of the same geometry (index of it, 0-based).
 *                     children:
 *                       type: array
 *                       items:
 *                         type: number
 *                       description: An array of integers pointing to other Semantic Objects of the same geometry (index of it, 0-based).
 *               values:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: A hierarchy of arrays with integers that refer to the index in the "surfaces" array of the same geometry (0-based).
 *           material:
 *             type: object
 *             $ref: '#/components/schemas/Material'
 *           texture:
 *             type: object
 *             $ref: '#/components/schemas/Texture'
 *         example:
 *           type: MultiSurface
 *           lod: 2,
 *           boundaries: [[[0, 3, 2, 1]], [[4, 5, 6, 7]], [[0, 1, 5, 4]], [[0, 2, 3, 8]], [[10, 12, 23, 48]]]
 *           semantics:
 *             surfaces: [ {
 *               type: WallSurface,
 *               slope: 33.4,
 *               children: [2] }, {
 *               type: RoofSurface,
 *               slope: 66.6 }, {
 *               type: Door,
 *               parent: 0,
 *               colour: blue } ]
 *             values: [0, 0, null, 1, 2]
 */

let mongoose = require("mongoose");

let GeometrySchema = new mongoose.Schema(
  {
    lod: {
      type: Number,
      required: function () {
        return [
          "MultiPoint",
          "MultiLineString",
          "MultiSurface",
          "CompositeSurface",
          "Solid",
          "MultiSolid",
          "CompositeSolid",
        ].includes(this.type);
      },
      validate: /([0-3]{1}\.?)+[0-3]?/,
    },
    boundaries: {}, // Validate with discriminated Schemas
    semantics: {},
    material: {},
    texture: {},
  },
  { discriminatorKey: "type" }
);

Geometry = mongoose.model("Geometry", GeometrySchema);

let GeometryInstance = new mongoose.Schema({
  // Different but the same
  template: {
    type: Number,
  },
  "vertices-templates": {
    type: Number,
  },
  boundaries: {
    type: [[Array]],
  },
  transformationMatrix: {
    type: [Number],
    validate: function () {
      return this["transformationMatrix"].length % 16 == 0;
    },
  },
});

let Solid = new mongoose.Schema({
  boundaries: { type: [[[[Number]]]], required: true },
  semantics: {
    surfaces: { type: [], default: undefined },
    values: [[Number]],
  },
  material: {
    visual: {
      values: { type: [[Number]], default: undefined },
    },
  },
  texture: {
    visual: {
      values: { type: [[[[Number]]]], default: undefined },
    },
  },
});

let MultiSolid = new mongoose.Schema({
  boundaries: { type: [[[[[Number]]]]], required: true },
  semantics: {
    surfaces: { type: [], default: undefined },
    values: [[[Number]]],
  },
  material: {
    visual: {
      values: { type: [[[Number]]], default: undefined },
    },
  },
  texture: {
    visual: {
      values: { type: [[[[[Number]]]]], default: undefined },
    },
  },
});

let MultiSurface = new mongoose.Schema({
  boundaries: { type: [[[Number]]], required: true },
  name: { type: String, required: true },
  semantics: { surfaces: { type: [], default: undefined }, values: [Number] },
  material: {
    visual: {
      values: { type: [Number], default: undefined },
    },
  },
  texture: {
    visual: {
      values: { type: [[[Number]]], default: undefined },
    },
  },
});

let MultiLineString = new mongoose.Schema({
  boundaries: { type: [[Number]], required: true },
});

let MultiPoint = new mongoose.Schema({
  boundaries: { type: [Number], required: true },
});

module.exports = {
  /*
  insertGeometry: async (object, jsonName) => {
    object.CityModel = jsonName;

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

    geometry["CityObject"] = object.name;

    try {
      let element = await geometry.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  getGeometryInstance: async (
    geometry,
    geometryTemplate,
    global_vertices,
    transform,
    vertices
  ) => {

    var new_vertices = []
    var response

    response = await switchGeometries(
      geometryTemplate.boundaries,
      vertices,
      []
    );

    geometryTemplate.boundaries = response[0]
    new_vertices = response[1]

    var m = geometry.transformationMatrix;

    for (var vertex in new_vertices) {
      var n = new_vertices[vertex].slice();
      n.push(1);

      for (var i in n) {
        new_vertices[vertex][i] =
          m[i * 4] * n[0] +
          m[i * 4 + 1] * n[1] +
          m[i * 4 + 2] * n[2] +
          m[i * 4 + 3] * n[3];
      }

      for (var i in n) {
        new_vertices[vertex][i] = new_vertices[vertex][i]/new_vertices[vertex][3]
      }

      new_vertices[vertex].splice(-1,1)
    }

    var refPoint = global_vertices[geometry.boundaries].slice();

    for (var i in refPoint) {
      refPoint[i] = refPoint[i] * transform.scale[i] + transform.translate[i];
    }

    for (vertex in new_vertices) {
      new_vertices[vertex][0] += refPoint[0];
      new_vertices[vertex][1] += refPoint[1];
      new_vertices[vertex][2] += refPoint[2];
    }

    return [geometryTemplate, new_vertices];
  },
  */
  Model: Geometry,
  Schema: GeometrySchema,
  MultiPoint: MultiPoint,
  MultiLineString: MultiLineString,
  MultiSurface: MultiSurface,
  Solid: Solid,
  MultiSolid: MultiSolid,
  GeometryInstance: GeometryInstance,
};

async function switchGeometries(array, vertices, new_vertices) {
  for (var el in array) {
    if (array[el].constructor === Array) {
      var response = await switchGeometries(array[el], vertices, new_vertices);
      array[el] = response[0];
      new_vertices = response[1];
    } else {
      var index = -1;
      for (var i in new_vertices) {
        if (String(new_vertices[i]) == String(vertices[array[el]])) {
          // Cast to String to avoid errors
          array[el] = i;
          index = i;
        }
      }

      if (index == -1) {
        var copyArray = vertices[array[el]].slice();
        array[el] = new_vertices.length;
        new_vertices.push(copyArray);
      }
    }
  }

  return [array, new_vertices];
}
