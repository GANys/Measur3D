/**
 * https://github.com/samhagman/mongoose-strictmodel
 */

module.exports = function StrictModelPlugin(Schema, options) {
  // Setup options
  var opts = options || {};
  var allowNonModelQueryParameters = !!opts.allowNonModelQueryParameters;
  var allowNonModelSelectionParameters = !!opts.allowNonModelSelectionParameters;

  /**
   * Holds all the model's fields (paths)
   * @type {Array}
   */
  var paths = [];
  Schema.eachPath(function (pathName, schemaType) {
    paths.push(pathName);
  });

  /* Attach function to every available pre hook. */
  Schema.pre("count", function (next) {
    restrictSelect(this, next);
  });
  Schema.pre("find", function (next) {
    restrictSelect(this, next);
  });
  Schema.pre("findOne", function (next) {
    restrictSelect(this, next);
  });
  Schema.pre("findOneAndRemove", function (next) {
    restrictSelect(this, next);
  });
  Schema.pre("findOneAndUpdate", function (next) {
    restrictSelect(this, next);
  });
  Schema.pre("update", function (next) {
    restrictSelect(this, next);
  });

  /**
   * Checks if query parameters contain references to fields not included in the Mongoose model
   * @param {Query} query - Mongoose query object
   */
  function validateQueryParameters(query) {
    var queryConditions = query.getQuery();
    var queryFields = Object.keys(queryConditions);

    // Go through each query field and see if it is in the Mongoose model's Schema
    for (
      var queryFieldIndex = 0;
      queryFieldIndex < queryFields.length;
      queryFieldIndex += 1
    ) {
      var queryField = queryFields[queryFieldIndex];

      if (paths.indexOf(queryField) === -1) {
        throw new Error(
          "Attempting to query on a field that is not listed in Mongoose model: " +
            queryField
        );
      }
    }
  }

  /**
   * Transforms a Mongoose inclusive projection to be restricted to the Mongoose model
   * @param {string[]} projectionFields - The originally requested inclusive projection fields
   * @returns {{field: 1}|{}} - - A new inclusive projection select query
   */
  function transformInclusionProjection(projectionFields) {
    var newSelectQuery = {};

    // Go through each requested field and only include paths in Schema in new select query
    for (
      var projFieldIndex = 0;
      projFieldIndex < projectionFields.length;
      projFieldIndex += 1
    ) {
      var projField = projectionFields[projFieldIndex];

      if (paths.indexOf(projField) > -1) {
        newSelectQuery[projField] = 1;
      } else if (!allowNonModelSelectionParameters) {
        throw new Error(
          "Attempting to project on a field that is not listed in Mongoose model"
        );
      }
    }

    return newSelectQuery;
  }

  /**
   * Transforms a Mongoose exclusive projection to be restricted to the Mongoose model
   * @param {{field: 0}} projectionFieldMap - The originally requested exclusive projection fields in a map
   * @returns {{field: 1}|{}} - A new inclusive projection select query
   */
  function transformExclusionProjection(projectionFieldMap) {
    var newSelectQuery = {};

    // Iterate through Schema paths and add all but the excluded ones to new select query
    for (var pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
      var path = paths[pathIndex];

      // If this path wasn't excluded by select parameters, add to new query
      if (projectionFieldMap[path] !== 0) {
        newSelectQuery[path] = 1;
      }
    }

    // If the amount of fields in the new query don't match the the number of fields in the model after subtracting
    // out the original exclusion fields, then the original exclusion projection included fields not in the model
    if (
      Object.keys(newSelectQuery).length !==
        paths.length - Object.keys(projectionFieldMap).length &&
      !allowNonModelSelectionParameters
    ) {
      throw new Error(
        "Attempting to project on a field that is not listed in Mongoose model."
      );
    }

    return newSelectQuery;
  }

  /**
   * Transforms a Mongoose query object to only contain fields listed in the Mongoose model
   * @param {Query} query - Mongoose query object
   * @param {function} next - Mongoose middleware helper - call to move on to next middleware
   * @returns {Query} - Return the transformed query object
   */
  function restrictSelect(query, next) {
    //==================================================================
    //
    //               CHECK QUERY PARAMETERS FOR FIELDS NOT IN MODEL
    //
    //==================================================================
    if (!allowNonModelQueryParameters) {
      validateQueryParameters(query);
    }

    //==================================================================
    //
    //               CHECK PROJECTION FOR FIELDS NOT IN MODEL
    //
    //==================================================================

    var projectionFieldMap = query._fields || {};
    var projectionFields = Object.keys(projectionFieldMap);

    // If there are no fields selected, select all of the model's fields
    if (projectionFields.length === 0) {
      query.select(paths.join(" "));
      return next();
    } else if (query._fields[projectionFields[0]] === 1) {
      // Query was Inclusion Projection

      query._fields = transformInclusionProjection(projectionFields);
      return next();
    } else {
      // Query was Exclusion Projection

      query._fields = transformExclusionProjection(projectionFieldMap);
      return next();
    }
  }

  return Schema;
};
