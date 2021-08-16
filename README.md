![Measur3D logo](client/src/images/logo_app_black.png)

# Measur3D

A light and compact CityJSON management tool.

This tool is built as a high-level MERN application. It therefore allows developing with a single language in both server and client side. It does not rely on an operating system layer.

3D city models are structured following the [CityJSON](https://www.cityjson.org/) encoding, a JSON-based encoding for storing 3D city models, also called digital maquettes or digital twins. Thanks to MongooseJS, inserted models are validated in regard of [CityJSON 1.0.1 specifications](https://www.cityjson.org/specs/1.0.1/). These specifications define the city model schema used to structure the database (several modifications were however made to suit to document-oriented databases).

## Prerequisites

A MongoDB server is mandatory. The choice between MongoDB Atlas, Community or Enterprise Server is left open.

Everything else is packaged in this repository and installed thanks to npm.

## Installing

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

Setup the project :

```
npm install
```

Compiles and minifies for production :

```
npm run build
```

Run a local host :

```
npm start
```

By default, the application is deployed on ```localhost:3000``` .

## Documentation

Documentations of the Measur3D API and the OGCAPIF can be found in the [API-DOCS file (Open API 3.0)](https://github.com/GANys/Measur3D/blob/master/api-docs.yaml).

## Built With

* [MongoDB](https://www.mongodb.com/) - A cross-platform document-oriented database
* [ExpressJS](https://expressjs.com/) - A fast, unopinionated, minimalist web framework for Node.js
* [ReactJS](https://reactjs.org/) - A JavaScript library for building user interfaces
* [Node.js](https://nodejs.org/en/) - An open-source, cross-platform, JavaScript runtime environment
* [Three.js](https://threejs.org/) - A cross-browser JavaScript library to display 3D objects in web browser
* [Mongoose](https://mongoosejs.com/) - An elegant mongodb object modeling for node.js

## News in v0.3.0

The v0.3.0 of Measur3D came with several improvements :

* Delete Object/Model from database and client
* Visualisation: improved UI, highlight of selected object and support of holes in geometries
* OGC API - Features compliant-ish (Thank to Hugo Ledoux for its insight and the CityJSONFeature object - [cityjson_ogcapi](https://github.com/hugoledoux/cityjson_ogcapi))
* GeometryInstance and GeometryTemplates support
* Security layers: rateLimiter, cache, DDOS, ...
* Swagger documentation (OpenAPI 3.0)

## News in v0.2.0

Public release

## Acknowledgments

The management of the 3D meshes is based on the [Ninja](https://ninja.cityjson.org/) viewer and its features. This tool is developed under the supervision of [Hugo Ledoux](https://twitter.com/hugoledoux) by the GeoInformation research Group from TUDelft.

## Authors

* **Gilles-Antoine Nys** - *Idea and development* - [Twitter](https://twitter.com/ga_nys)

This project is part of the PhD Thesis of GANys under the supervision of [Prof. Roland Billen](https://twitter.com/RolandBillen) - [Geomatics Unit](http://geomatics.ulg.ac.be/home.php), University of Liège, Belgium. It is also part of the SIG3.0 project funded by the [National Fund for Scientific Research](https://www.frs-fnrs.be/en), Belgium.

![UGeom logo](client/src/images/logo_geomatics.png)

## License

This project is licensed under the Apache License - see the [LICENSE.md](LICENSE) file for details.

## If you use Measur3D or the simplified database schema in a scientific context, please cite this article:
Nys G.-A. and Billen R. (2021). From consistency to flexibility: A simplified database schema for the management of CityJSON 3D city models. Transactions in GIS.

```
@article{nys_consistency_2021,
	title = {From consistency to flexibility: {A} simplified database schema for the management of {CityJSON} {3D} city models},
	doi = {10.1111/tgis.12807},
	urldate = {2021-08-16},
	journal = {Transactions in GIS},
	author = {Nys, Gilles-Antoine and Billen, Roland},
	month = jul,
	year = {2021},
}
```
