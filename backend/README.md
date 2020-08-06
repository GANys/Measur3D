**Measur3D - backend API**
----
This API allows people to handle compact city models on a document-oriented database.

Measur3D relies on JavaScript libraries such as follows for the server side:

* [MongoDB](https://www.mongodb.com/) - A cross-platform document-oriented database
* [ExpressJS](https://expressjs.com/) - A fast, unopinionated, minimalist web framework for Node.js
* [Node.js](https://nodejs.org/en/) - An open-source, cross-platform, JavaScript runtime environment
* [Mongoose](https://mongoosejs.com/) - An elegant mongodb object modeling for node.js

By default, in this project, the API in deployed on `localhost:3001/measur3d`

Current methods are the following :

* `getAllCityModels` - GET all city models from database.
* `getObject` - GET a specific city object.
* `getObjectAttributes` - GET a specific city object attributes.
* `putCityModel` - POST a valid CityJSON model.
* `updateObjectAttribute` - PUT attribute of a specific city object.
----
**getAllCityModels**
	This method allows to get all the citymodels stored in the database.

* **URL**
  /measur3d/getAllCityModels

* **Method:**
  `GET`

*  **URL Params**
   No parameter required.

* **Success Response:**
  Returns an array of all city models.
  * **Code:** 200
  *  **Content:** `[ { JSON Objects } ]`

* **Error Response:**
  Database can be empty  - server error should express it.

  * **Code:** 500 INTERNAL SERVER ERROR
  *  **Content:** `{ error : "There is no City Models." }`

----
**getObject**
  This method allows to get a specific City Object within a specific Collection.

* **URL**
/measur3d/getObject

* **Method:**
  `GET`

* **URL Params**
  **Required:**

   `id: String` - Unique ID of the city object
   `CityObjectClass: String` - Class of the city object

  OR

   `name: String` - Unique name of the city object
   `CityObjectClass: String` - Class of the city object

* **Success Response:**
  Returns a JSON object.
  * **Code:** 200
  *  **Content:** `{ JSON Object }`

* **Error Response:**
	Object may not exist or request can be malformed  - server error should express it.
  * **Code:** 500 INTERNAL SERVER ERROR
  *  **Content:** `{ error : "Mongoose had an internal problem." }`

  OR

  * **Code:** 400 BAD REQUEST
  *  **Content:** `{ error : "Params are not valid - getObject could not find Object in Collection." }`
----
**getObjectAttributes**
  This method allows to query all attributes of an City Object within a specific Collection.

* **URL**
  /measur3d/getObjectAttributes

* **Method:**
  `GET`

*  **URL Params**
     **Required:**

   `id: String` - Unique ID of the city object
   `CityObjectClass: String` - Class of the city object

   OR

   `name: String` - Unique name of the city object
   `CityObjectClass: String` - Class of the city object

* **Success Response:**
    Returns a JSON object.
    * **Code:** 200
    *  **Content:** `{ JSON Object }`

* **Error Response:**
	Object may not exist or request can be malformed  - server error should express it.
    * **Code:** 500 INTERNAL SERVER ERROR
    *  **Content:** `{ error : "Mongoose had an internal problem." }`

    OR

    * **Code:** 400 BAD REQUEST
    *  **Content:** `{ error : "Params are not valid - getObject could not find Object in Collection." }`
----
**uploadCityModel**
  This method allows to upload a CityJSON model to the database.

* **URL**
  /measur3d/uploadCityModel

* **Method:**
 `POST`

* **Data Params**
  `json: { JSON Object }` - Compliant CityJSON file
  `jsonName: String` - Name of the city model

* **Success Response:**
  Returns no data.
  * **Code:** 201
  *  **Content:** `{success: "City model imported with success !"}`

* **Error Response:**
City Model may not be valid - server error should express it.
  * **Code:** 500 INTERNAL SERVER ERROR
  *  **Content:** `{ error : "Mongoose had an internal problem." }`
----
**updateObjectAttribute**
This method allows to update an attribute of a specific City Object.
* **URL**
  /measur3d/updateObjectAttribute

* **Method:**
`PUT`

* **Data Params**

  `key: String` - Key of the attribute
  `value: String` - Value of the attribute
  `jsonName: String` - Name of the city object
  `CityObjectClass: String` - Class of the city object

* **Success Response:**
  Returns no data.
  * **Code:** 200
  *  **Content:** `{ success: "Object updated."}`

* **Error Response:**
Object may not exist or request can be malformed  - server error should express it.
  * **Code:** 500 INTERNAL SERVER ERROR
  *  **Content:** `{ error : "Mongoose had an internal problem." }`
----
