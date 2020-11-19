var express = require('express')
var router = express.Router()
var make = require('./dispatch');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

// define the home page route
router.get('/', function (req, res) {

  var dispatch = make.header("Measur3d", "Open web API on CityJSON objects compliant with the OGC API - Features standard.");
  dispatch.links.push(make.item("http://localhost/features/",            "self",         "application/json", "this document"));
  dispatch.links.push(make.item("http://localhost/features/api",         "service-desc", "application/vnd.oai.openapi+json;version=3.0", "the API definition"));
  dispatch.links.push(make.item("http://localhost/features/api.html",    "service-doc",  "text/html",        "the API documentation"));
  dispatch.links.push(make.item("http://localhost/features/conformance", "conformance",  "application/json", "OGC API conformance classes implemented by this server"));
  dispatch.links.push(make.item("http://localhost/features/collections", "data",         "application/json", "Information about the feature collections"));

  res.json(dispatch)
})

router.get('/conformance', function (req, res) {
  var conformance = {};
  conformance.conformsTo = [];
  conformance.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core");
  conformance.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30");
  conformance.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html");
  conformance.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson");
  res.json(conformance)
})


router.get('/api', function (req, res) {
  res.json('{api def here in json}')
})

router.get('/api.html', function (req, res) {
  res.send('api description in html')
})

router.get('/collections', function (req, res) {
  res.send('collections')

})

router.get('/collections/:collectionId', function (req, res) {
  res.send('collections collectionId')
})

router.get('/collections/:collectionId/items', function (req, res) {
  res.send('collections/:collectionId/items')
})

router.get('/collections/:collectionId/items/:item', function (req, res) {
  console.log(req.params);
  res.send('collections/:collectionId/items/:item')
})

module.exports = router
