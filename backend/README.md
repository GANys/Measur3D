**Measur3D - backend API**
----
This API allows handling compact city models on a document-oriented database.

Measur3D relies on JavaScript libraries such as follows for the server side:

* [MongoDB](https://www.mongodb.com/) - A cross-platform document-oriented database
* [ExpressJS](https://expressjs.com/) - A fast, unopinionated, minimalist web framework for Node.js
* [Node.js](https://nodejs.org/en/) - An open-source, cross-platform, JavaScript runtime environment
* [Mongoose](https://mongoosejs.com/) - An elegant mongodb object modeling for node.js

By default, in this project, the API in deployed on `localhost:3001/measur3d`

Current methods are the following :

* `uploadCityModel` - POST a valid CityJSON model.
* `getCityModelsList` - GET all city models name stored in the database in a list.
* `getNamedCityModel` - GET a named city model from database.
* `deleteNamedCityModel` - DELETE a named city model from database.
* `getObject` - GET a specific city object.
* `getObjectAttributes` - GET a specific city object attributes.
* `updateObjectAttribute` - PUT attribute of a specific city object.
----
**uploadCityModel**
  This method allows uploading a CityJSON model to the database.

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
**getCityModelsList**
	This method allows getting all city models name stored in the database in a list.

* **URL**
  /measur3d/getCityModelsList

* **Method:**
  `GET`

*  **URL Params**
   No parameter required.

* **Success Response:**
  Returns a named city model from database.
  * **Code:** 200
  *  **Content:** `[ String ]`

* **Error Response:**
  Database can be empty  - server error should express it.

  * **Code:** 404 NOT FOUND
  *  **Content:** `{ error : "There is no CityModels in the DB." }`

----
**getNamedCityModel**
	This method allows getting a named city model from database.

* **URL**
  /measur3d/getNamedCityModel

* **Method:**
  `GET`

*  **URL Params**
   **Required:**

   `name: String` - Unique name of the city model

* **Success Response:**
  Returns the named city model.
  * **Code:** 200
  *  **Content:** `[ { JSON Object } ]`

* **Error Response:**
  Database can be empty  - server error should express it.

  * **Code:** 404 NOT FOUND
  *  **Content:** `{ error : "There is no CityModel with this name in the DB." }`

----
**deleteNamedCityModel**
	This method allows deleting a named city model from database.

* **URL**
  /measur3d/deleteNamedCityModel

* **Method:**
  `DELETE`

*  **URL Params**
   **Required:**

   `name: String` - Unique name of the city model

* **Success Response:**
  Returns a success message.
  * **Code:** 200
  *  **Content:** `{ success: "City model deleted with success !" }`

* **Error Response:**
  Database can be empty  - server error should express it.

  * **Code:** 500 INTERNAL SERVER ERROR
  *  **Content:** `{ error : "There is no object with that name." }`

----
**getObject**
  This method allows getting a specific City Object within a specific Collection.

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
  This method allows querying all attributes of an City Object within a specific Collection.

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
**updateObjectAttribute**
This method allows updating an attribute of a specific City Object.
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
