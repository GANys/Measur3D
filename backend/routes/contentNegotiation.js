const swig = require("swig-templates");

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

// Service Metadata
const serviceTitle = "Measur3D OGC API - Features server";
const serviceDescription =
  "Access CityJSON models and its features stored locally in a MongoDB store via a Web API that conforms to the OGC API Features specification.";
const serviceUrl = "http://localhost:3001/features";

function landingJSON() {
  var landingPage = header(serviceTitle, serviceDescription);

  landingPage.links.push(
    link(serviceUrl, "self", "application/json", "this document")
  );
  landingPage.links.push(
    link(
      serviceUrl + "api",
      "service-desc",
      "application/vnd.oai.openapi+json;version=3.0",
      "the API definition"
    )
  );
  landingPage.links.push(
    link(
      serviceUrl + "api.html",
      "service-doc",
      "text/html",
      "the API documentation"
    )
  );
  landingPage.links.push(
    link(
      serviceUrl + "conformance",
      "conformance",
      "application/json",
      "OGC API conformance classes implemented by this server"
    )
  );
  landingPage.links.push(
    link(
      serviceUrl + "collections",
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
      author: "Gilles-Antoine Nys  - Geomatics Unit, ULiège, Belgium"
    });

  return renderedHtml;
}

function landing(t) {
  if (t == "json") return landingJSON();
  return landingHTML();
}

//-------------------------------------------------------------------------------------

function collectionsJSON(collections) {
    var json = {}

    json.links = []
    json.links.push(link(serviceUrl + "collections", "self", "application/json", "Metadata about the feature collections"));

    json.collections = [];

    for (var collection in collections) {

      var item = header(collections[collection], collections[collection]);

      item.links.push(link(serviceUrl + "collections/" + collections[collection] + "/items", "item", "application/json", collections[collection]));
      json.collections.push(item);
    }

    return json;
}

function collectionsHTML(collections) {

    var items = [];

    for (var collection in collections) {
      var item = {};
      item.url = serviceUrl;
      item.title = collections[collection];
      items.push(item);
    }

    var tmpl = swig.compileFile(__dirname + '/template/collections.template'),
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

function collections(t, collections) {
    if (t == "json")
        return collectionsJSON(collections);
    return collectionsHTML(collections);
}

//-------------------------------------------------------------------------------------

function collectionJSON(collection) {
    var json = {}

    json.links = []
    json.links.push(link(serviceUrl + "collections", "self", "application/json", "Metadata about the feature collections"));

    json.collections = [];

    var item = header(collection, collection);
    item.links.push(link(serviceUrl + "collections/" + collection + "/items", "item", "application/json", collection));
    json.collections.push(item);

    return json;
}

function collectionHTML(collectionId) {

    var item = {};
    item.url = serviceUrl;
    item.title = collectionId;

    var tmpl = swig.compileFile(__dirname + '/template/collection.template'),
    renderedHtml = tmpl({
        collection: item,
    });

    return renderedHtml;
}

function collection(t, collectionId) {
    if (t == "json")
        return collectionJSON(collectionId);
    return collectionHTML(collectionId);
}

//-------------------------------------------------------------------------------------

module.exports = { landing, collections, collection };
