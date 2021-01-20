let mongoose = require("mongoose");

/**
 *  @swagger
 *   components:
 *     tags: [Measur3D]
 *     schemas:
 *       AbstractCityObject:
 *         type: object
 *         required:
 *           - name
 *           - CityModel
 *         properties:
 *           name:
 *             type: string
 *             description: Unique name of the CityObject (not its UUID) - created by the method '#/Measur3D/uploadCityModel'.
 *           CityModel:
 *             type: string
 *             description: Reference to the parent CityModel - created by the method '#/Measur3D/uploadCityModel'.
 *           attributes:
 *             type: object
 *             properties:
 *               class:
 *                 type: string
 *               function:
 *                 type: string
 *               usage:
 *                 type: string
 *             description: Besides the standard attributes (https://www.sig3d.de/codelists/standard/), any other attributes not prescribed by the CityGML data model can be added with a JSON key-value pair.
 *           parents:
 *             type: array
 *             items:
 *               type: string
 *             description: An array of the IDs (of type string) of the City Objects that are its parents.
 *           children:
 *             type: array
 *             items:
 *               type: string
 *             description: An array of the IDs (of type string) of the 2nd-level City Objects that are part of the City Object.
 *           geographicalExtent:
 *             type: array
 *             items:
 *               type: number
 *             description: An array with 6 values - [minx, miny, minz, maxx, maxy, maxz].
 *           spatialIndex:
 *             type: boolean
 *             description: A boolean specifiying if the object is spatially indexed or not.
 *           location:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 default: ['Polygon']
 *               coordinates:
 *                 type: string
 *                 format: ISO19107
 *             description: A hierarchy of arrays following the ISO19107 standard. Duplicate information of the '#/geographicalExtent'. Useful in order to index objects spatialy.
 *           geometry:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Geometry'
 *             description: The date of the record creation.
 *           transform:
 *             type: object
 *             required:
 *               - scale
 *               - translate
 *             properties:
 *               scale:
 *                 type: array
 *                 items:
 *                   type: number
 *               translate:
 *                 type: array
 *                 items:
 *                   type: number
 *             description: Scale factor and the translation needed to obtain the original coordinates from the integer vertices (stored with floats/doubles)
 *           vertices:
 *             type: array
 *             items:
 *               type: array
 *               items:
 *                type: number
 *             description: An array of coordinates of each vertex of the city object. Their position in this array (0-based) is used as an index to be referenced by the Geometric Objects. The indexing mechanism of the format Wavefront OBJ is basically reused. Vertices are stored as integer (refer to #/transform).
 *         example:
 *            name: Liège-4000-1337
 *            type: Building
 *            geographicalExtent: [ 45789.1, 123849.0, 2.4, 45789.7, 123873.4, 35.2 ]
 *            attributes:
 *              creationDate: 1980
 *              price: 415.000€
 *              owner: Adrien Nougaret
 *            children: [Liège-4000-1234]
 *            geometry: [...]
 */

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
  location: {
    type: { type: String, enum: ["Polygon"] },
    coordinates: { type: [[[Number]]] }
  },
  spatialIndex: { type: Boolean, default: false },
  geometry: [mongoose.Schema.Types.Mixed],
  transform: {
    // No additional properties
    scale: {
      type: [Number],
      default: undefined,
      validate: function() {
        return this.transform["scale"].length == 3;
      }
    },
    translate: {
      type: [Number],
      default: undefined,
      validate: function() {
        return this.transform["translate"].length == 3;
      }
    }
  },
  vertices: [[Number]]
});

//CityObjectSchema.index({ location: '2dsphere' })

CityObject = mongoose.model("CityObject", CityObjectSchema);

module.exports = {
  Model: CityObject,
  Schema: CityObjectSchema
};
