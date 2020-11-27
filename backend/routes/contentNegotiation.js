const swig = require("swig-templates");
let proj4 = require("proj4");
const axios = require("axios");

function header(title, description) {
  var header = {};
  header.title = title;
  header.description = description;
  header.links = [];
  return header;
}

function link(href, rel, type, title) {
  var item = {};
  item.href = href;
  item.rel = rel;
  item.type = type;
  item.title = title;

  return item;
}

//-------------------------------------------------------------------------------------

// Service Metadata
const serviceTitle = "Measur3D OGC API - Features server";
const serviceDescription =
  "Access CityJSON models and its features stored locally in a MongoDB store via a Web API that conforms to the OGC API Features specification.";
const serviceUrl = "http://localhost:3001/features"; // Without last /

function landingJSON() {
  var landingPage = header(serviceTitle, serviceDescription);

  landingPage.links.push(
    link(serviceUrl, "self", "application/json", "this document")
  );
  landingPage.links.push(
    link(serviceUrl + "?f=html", "alternate", "text/html", "this document as HTML")
  );
  landingPage.links.push(
    link(
      serviceUrl + "/api",
      "service-desc",
      "application/vnd.oai.openapi+json;version=3.0",
      "the API definition"
    )
  );
  landingPage.links.push(
    link(
      serviceUrl + "/api.html",
      "service-doc",
      "text/html",
      "the API documentation"
    )
  );
  landingPage.links.push(
    link(
      serviceUrl + "/conformance",
      "conformance",
      "application/json",
      "OGC API conformance classes implemented by this server"
    )
  );
  landingPage.links.push(
    link(
      serviceUrl + "/collections",
      "data",
      "application/json",
      "Information about the feature collections"
    )
  );

  return landingPage;
}

function landingHTML() {
  var tmpl = swig.compileFile(__dirname + "/template/landing.template"),
    renderedHtml = tmpl({
      title: serviceTitle,
      url: serviceUrl,
      author: "Gilles-Antoine Nys  - Geomatics Unit, ULiège, Belgium",
    });

  return renderedHtml;
}

function landing(t) {
  if (t == "json") return landingJSON();
  return landingHTML();
}

//-------------------------------------------------------------------------------------

async function collectionsJSON(collections) {
  var json = {};

  json.links = [];
  json.links.push(
    link(
      serviceUrl + "collections?f=json",
      "self",
      "application/json",
      "this document"
    )
  );
  json.links.push(
    link(
      serviceUrl + "collections?f=html",
      "alternate",
      "text/html",
      "this document as HTML"
    )
  );

  json.collections = [];

  for (var collection in collections) {
    var item = header(
      collections[collection].name,
      "CityModel object - " + collections[collection].name
    );

    if (collections[collection].metadata != undefined) {
      item.extent = {};
      if (collections[collection].metadata.geographicalExtent != undefined) {
        item.extent.spatial = {};

        if (collections[collection].metadata.referenceSystem != undefined) {
          var reg = /\d/g; // Only numbers

          var epsgio =
            "https://epsg.io/" +
            collections[collection].metadata.referenceSystem
              .match(reg)
              .join("") +
            ".proj4";

          var proj_string = await axios.get(epsgio);

          proj4.defs("currentProj", proj_string.data);

          var bbox = collections[collection].metadata.geographicalExtent;

          var min = proj4("currentProj", "WGS84", [bbox[0], bbox[1]]);
          var max = proj4("currentProj", "WGS84", [bbox[3], bbox[4]]);

          bbox[0] = min[0];
          bbox[1] = min[1];
          bbox[4] = max[0];
          bbox[3] = max[1];

          item.extent.spatial.bbox = [bbox];
        } else {
          item.extent.spatial.bbox = [
            collections[collection].metadata.geographicalExtent,
          ];
        }

        item.extent.spatial.crs =
          "http://www.opengis.net/def/crs/OGC/1.3/CRS84";
      }
      item.extent.temporal = null;
    }

    item.links.push(
      link(
        serviceUrl + "collections/" + collections[collection].name + "/items",
        "items",
        "application/json",
        "items of "  + collections[collection].name
      )
    );
    json.collections.push(item);
  }

  return json;
}

function collectionsHTML(collections) {
  var items = [];

  for (var collection in collections) {
    var item = {};
    item.url = serviceUrl;
    item.title = collections[collection].name;
    items.push(item);
  }

  var tmpl = swig.compileFile(__dirname + "/template/collections.template"),
    renderedHtml = tmpl({
      collections: items,
    });

  return renderedHtml;
}

/**
 *  @swagger
 *   components:
 *     tags: [Features]
 *     schemas:
 *       collections:
 *         type: object
 *         required:
 *           - links
 *           - collections
 *         properties:
 *           links:
 *             type: array
 *             items:
 *               $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/link.yaml
 *           collections:
 *             type: array
 *             items:
 *               $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/collection.yaml
 */

async function collections(t, collections) {
  if (t == "json") return await collectionsJSON(collections);
  return await collectionsHTML(collections);
}

//-------------------------------------------------------------------------------------

async function collectionJSON(collection) {
  var json = {};

  var json = header(
    collection.name,
    "CityModel object - " + collection.name
  );

  if (collection.metadata != undefined) {
    json.extent = {};
    if (collection.metadata.geographicalExtent != undefined) {
      json.extent.spatial = {};
      if (collection.metadata.referenceSystem != undefined) {
        var reg = /\d/g; // Only numbers

        var epsgio =
          "https://epsg.io/" +
          collection.metadata.referenceSystem
            .match(reg)
            .join("") +
          ".proj4";

        var proj_string = await axios.get(epsgio);

        proj4.defs("currentProj", proj_string.data);

        var bbox = collection.metadata.geographicalExtent;

        var min = proj4("currentProj", "WGS84", [bbox[0], bbox[1]]);
        var max = proj4("currentProj", "WGS84", [bbox[3], bbox[4]]);

        bbox[0] = min[0];
        bbox[1] = min[1];
        bbox[4] = max[0];
        bbox[3] = max[1];

        json.extent.spatial.bbox = [bbox];
      } else {
        json.extent.spatial.bbox = [
          collection.metadata.geographicalExtent,
        ];
      }

      json.extent.spatial.crs =
        "http://www.opengis.net/def/crs/OGC/1.3/CRS84";
    }
    json.extent.temporal = null;
  }

  json.links = [];
  json.links.push(
    link(
      serviceUrl + "collections?f=json",
      "self",
      "application/json",
      "this document"
    )
  );
  json.links.push(
    link(
      serviceUrl + "collections?f=html",
      "alternate",
      "text/html",
      "this document as HTML"
    )
  );
  json.links.push(
    link(
      serviceUrl + "collections/" + collection.name + "/items",
      "items",
      "application/json",
      "CityObjects"
    )
  );

  return json;
}

function collectionHTML(collectionId) {
  var item = {};
  item.url = serviceUrl;
  item.title = collectionId.name;

  var tmpl = swig.compileFile(__dirname + "/template/collection.template"),
    renderedHtml = tmpl({
      collection: item,
    });

  return renderedHtml;
}

async function collection(t, collectionId) {
  if (t == "json") return await collectionJSON(collectionId);
  return await collectionHTML(collectionId);
}

//-------------------------------------------------------------------------------------

function itemsJSON(collectionId, geojson) {
  return JSON.parse(JSON.stringify(geojson));
}

function itemsHTML(collectionId, geojson) {
  var item = {};
  item.url = serviceUrl;
  item.title = collectionId;
  item.geojson = JSON.stringify(geojson);

  var tmpl = swig.compileFile(__dirname + "/template/items.template"),
    renderedHtml = tmpl({
      collection: item,
    });

  return renderedHtml;
}

function items(t, collectionId, geojson) {
  if (t == "json") return itemsJSON(collectionId, geojson);
  return itemsHTML(collectionId, geojson);
}

//-------------------------------------------------------------------------------------
module.exports = { landing, collections, collection, items };
