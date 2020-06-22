/*
This file comes partially from the 3D GeoInformaiton Group from TU Delft
Code is available on https://github.com/tudelft3d/CityJSON-viewer/
This concerns the functions related to the object rendering.
It has been slightly modified to handle React components and integrated within the MERN app.
*/

import * as THREE from "three";
import * as earcut from "./earcut";

import axios from "axios";

import { EventEmitter } from "./events";

var ALLCOLOURS = {
  Building: 0xcc0000,
  BuildingPart: 0xcc0000,
  BuildingInstallation: 0xcc0000,
  Bridge: 0x999999,
  BridgePart: 0x999999,
  BridgeInstallation: 0x999999,
  BridgeConstructionElement: 0x999999,
  CityObjectGroup: 0xffffb3,
  CityFurniture: 0xcc0000,
  GenericCityObject: 0xcc0000,
  LandUse: 0xffffb3,
  PlantCover: 0x39ac39,
  Railway: 0x000000,
  Road: 0x999999,
  SolitaryVegetationObject: 0x39ac39,
  TINRelief: 0x3fd43f,
  TransportSquare: 0x999999,
  Tunnel: 0x999999,
  TunnelPart: 0x999999,
  TunnelInstallation: 0x999999,
  WaterBody: 0x4da6ff
};

//convert CityObjects to mesh and add them to the viewer
export async function loadCityObjects(threescene) {
  await axios
    .get("http://localhost:3001/measur3d/getAllCityModels")
    .then(async responseCities => {
      // eslint-disable-next-line
      if (responseCities.data === undefined || responseCities.data.length == 0)
        return; // If server response empty -> Server does not store any citymodel

      var json;

      console.log(responseCities);

      for (var i = 0; i < responseCities.data.length; i++) {
        json = responseCities.data[i];

        //create one geometry that contains all vertices (in normalized form)
        //normalize must be done for all coordinates as otherwise the objects are at same pos and have the same size
        var normGeom = new THREE.Geometry();

        for (i = 0; i < json.vertices.length; i++) {
          var point = new THREE.Vector3(
            json.vertices[i][0],
            json.vertices[i][1],
            json.vertices[i][2]
          );
          normGeom.vertices.push(point);
        }

        normGeom.normalize();

        for (i = 0; i < json.vertices.length; i++) {
          json.vertices[i][0] = normGeom.vertices[i].x;
          json.vertices[i][1] = normGeom.vertices[i].y;
          json.vertices[i][2] = normGeom.vertices[i].z;
        }

        var stats = getStats(json.vertices);
        var avgX = stats[3];
        var avgY = stats[4];
        var avgZ = stats[5];

        threescene.camera.position.set(0, 0, 2);
        threescene.camera.lookAt(avgX, avgY, avgZ);

        threescene.camera.updateProjectionMatrix();

        threescene.controls.target.set(avgX, avgY, avgZ);

        //enable movement parallel to ground
        threescene.controls.screenSpacePanning = true;

        //count number of objects
        var totalco = Object.keys(json.CityObjects).length;
        console.log("Total # City Objects: ", totalco);

        //create dictionary
        var children = {};

        //iterate through all cityObjects
        for (var cityObj in json.CityObjects) {
          var cityObjectType = json.CityObjects[cityObj].type;

          switch (cityObjectType) {
            case "BuildingPart":
              cityObjectType = "Building";
              break;
            case "Road":
            case "Railway":
            case "TransportSquare":
              cityObjectType = "Transportation";
              break;
            case "TunnelPart":
              cityObjectType = "Tunnel";
              break;
            case "BridgePart":
              cityObjectType = "Bridge";
              break;
            case "BridgeConstructionElement":
              cityObjectType = "BridgeInstallation";
              break;
            default:
          }

          try {
            //parse cityObj that it can be displayed in three js
            var returnChildren = await parseObject(
              json.CityObjects[cityObj],
              json,
              cityObj,
              threescene.geoms
            );

            //if object has children add them to the childrendict
            for (i in returnChildren) {
              children[json.name + "_" + returnChildren[i]] = cityObj;
            }
          } catch (e) {
            var error_message = "ERROR at creating: " + cityObj;
            EventEmitter.dispatch("error", error_message);
            continue;
          }

          //set color of object
          var coType = json.CityObjects[cityObj].type;
          var material = new THREE.MeshLambertMaterial();
          material.color.setHex(ALLCOLOURS[coType]);

          //create mesh
          var coMesh = new THREE.Mesh(threescene.geoms[cityObj], material);
          coMesh.name = cityObj;
          coMesh.CityObjectClass = json.CityObjects[cityObj].type;
          coMesh.jsonName = json.name;
          coMesh.castShadow = true;
          coMesh.receiveShadow = true;
          threescene.scene.add(coMesh);
          threescene.meshes.push(coMesh);
        }
      }
    })
    .then(() => {
      threescene.setState({
        boolJSONload: true //enable function as click on objects
      });
    });
}

//-- calculate normal of a set of points
function get_normal_newell(indices) {
  // find normal with Newell's method
  var n = [0.0, 0.0, 0.0];

  for (var i = 0; i < indices.length; i++) {
    var nex = i + 1;
    // eslint-disable-next-line
    if (nex == indices.length) {
      nex = 0;
    }
    n[0] =
      n[0] + (indices[i].y - indices[nex].y) * (indices[i].z + indices[nex].z);
    n[1] =
      n[1] + (indices[i].z - indices[nex].z) * (indices[i].x + indices[nex].x);
    n[2] =
      n[2] + (indices[i].x - indices[nex].x) * (indices[i].y + indices[nex].y);
  }
  var b = new THREE.Vector3(n[0], n[1], n[2]);
  return b.normalize();
}

function to_2d(p, n) {
  p = new THREE.Vector3(p.x, p.y, p.z);
  var x3 = new THREE.Vector3(1.1, 1.1, 1.1);
  if (x3.distanceTo(n) < 0.01) {
    x3.add(new THREE.Vector3(1.0, 2.0, 3.0));
  }
  var tmp = x3.dot(n);
  var tmp2 = n.clone();
  tmp2.multiplyScalar(tmp);
  x3.sub(tmp2);
  x3.normalize();
  var y3 = n.clone();
  y3.cross(x3);
  let x = p.dot(x3);
  let y = p.dot(y3);
  var re = { x: x, y: y };
  return re;
}

function getStats(vertices) {
  var minX = Number.MAX_VALUE;
  var minY = Number.MAX_VALUE;
  var minZ = Number.MAX_VALUE;

  var sumX = 0;
  var sumY = 0;
  var sumZ = 0;
  var counter = 0;

  for (var i in vertices) {
    sumX = sumX + vertices[i][0];
    if (vertices[i][0] < minX) {
      minX = vertices[i][0];
    }

    sumY = sumY + vertices[i][1];
    if (vertices[i][1] < minY) {
      minY = vertices[i][1];
    }

    if (vertices[i][2] < minZ) {
      minZ = vertices[i][2];
    }

    sumZ = sumZ + vertices[i][2];
    counter = counter + 1;
  }

  var avgX = sumX / counter;
  var avgY = sumY / counter;
  var avgZ = sumZ / counter;

  return [minX, minY, minZ, avgX, avgY, avgZ];
}

//convert json file to viwer-object
async function parseObject(object, json, cityObj, geoms) {
  var boundaries;

  /* Remains of NINJA
  if (json.CityObjects[cityObj].children != undefined) {
    return json.CityObjects[cityObj].children;
  }
  */

  //create geometry and empty list for the vertices
  var geom = new THREE.Geometry();

  //each geometrytype must be handled different
  var geomType = object.geometry[0].type;
  // eslint-disable-next-line
  if (geomType == "Solid") {
    // eslint-disable-next-line
    boundaries = object.geometry[0].boundaries[0];
    // eslint-disable-next-line
  } else if (geomType == "MultiSurface" || geomType == "CompositeSurface") {
    // eslint-disable-next-line
    boundaries = object.geometry[0].boundaries;
    // eslint-disable-next-line
  } else if (geomType == "MultiSolid" || geomType == "CompositeSolid") {
    boundaries = object.geometry[0].boundaries;
  }

  //needed for assocation of global and local vertices
  var verticeId = 0;

  var vertices = []; //local vertices
  var indices = []; //global vertices
  var boundary = [];

  //contains the boundary but with the right verticeId
  for (var i = 0; i < boundaries.length; i++) {
    for (var j = 0; j < boundaries[i][0].length; j++) {
      //the original index from the json file
      var index = boundaries[i][0][j];

      //if this index is already there
      if (vertices.includes(index)) {
        var vertPos = vertices.indexOf(index);
        indices.push(vertPos);
        boundary.push(vertPos);
      } else {
        //add vertice to geometry
        var point = new THREE.Vector3(
          json.vertices[index][0],
          json.vertices[index][1],
          json.vertices[index][2]
        );
        geom.vertices.push(point);

        vertices.push(index);
        indices.push(verticeId);
        boundary.push(verticeId);

        verticeId = verticeId + 1;
      }
    }

    //create face
    //triangulated faces
    // eslint-disable-next-line
    if (boundary.length == 3) {
      geom.faces.push(new THREE.Face3(boundary[0], boundary[1], boundary[2]));

      //non triangulated faces
    } else if (boundary.length > 3) {
      //create list of points
      var pList = [];
      for (j = 0; j < boundary.length; j++) {
        pList.push({
          x: json.vertices[vertices[boundary[j]]][0],
          y: json.vertices[vertices[boundary[j]]][1],
          z: json.vertices[vertices[boundary[j]]][2]
        });
      }
      //get normal of these points
      var normal = await get_normal_newell(pList);

      //convert to 2d (for triangulation)
      var pv = [];
      for (j = 0; j < pList.length; j++) {
        var re = await to_2d(pList[j], normal);
        pv.push(re.x);
        pv.push(re.y);
      }

      //triangulate
      var tr = await earcut(pv, null, 2);

      //create faces based on triangulation
      for (j = 0; j < tr.length; j += 3) {
        geom.faces.push(
          new THREE.Face3(
            boundary[tr[j]],
            boundary[tr[j + 1]],
            boundary[tr[j + 2]]
          )
        );
      }
    }

    //reset boundaries
    boundary = [];
  }

  //needed for shadow
  geom.computeFaceNormals();

  geoms[object.name] = geom;

  return "";
}

//action if mouseclick (for getting attributes ofobjects)
export async function intersectMeshes(event, threescene) {
  //if no cityjson is loaded return
  // eslint-disable-next-line
  if (threescene.state.boolJSONload == false) {
    return;
  }

  threescene.mouse.x =
    (event.offsetX / threescene.renderer.domElement.clientWidth) * 2 - 1;
  threescene.mouse.y =
    -(event.offsetY / threescene.renderer.domElement.clientHeight) * 2 + 1;

  //get cameraposition
  threescene.raycaster.setFromCamera(threescene.mouse, threescene.camera);

  //calculate intersects
  var intersects = threescene.raycaster.intersectObjects(threescene.meshes);

  //if clicked on nothing return
  // eslint-disable-next-line
  if (intersects.length == 0) {
    if (threescene.HIGHLIGHTED)
      threescene.HIGHLIGHTED.material.emissive.setHex(
        threescene.HIGHLIGHTED.currentHex
      );

    var add_attribute_button = document.querySelector(
      "#root > div > div.SplitPane.vertical > div.Pane.vertical.Pane1 > div > div.Pane.horizontal.Pane2 > div > div.Pane.horizontal.Pane2 > div > div.Pane.horizontal.Pane2 > div > div > div.MuiToolbar-root.MuiToolbar-regular.MTableToolbar-root-75.MuiToolbar-gutters > div.MTableToolbar-actions-78"
    );

    add_attribute_button.style.visibility = "hidden";

    EventEmitter.dispatch("attObjectTitle", ("Object attributes", null));
    EventEmitter.dispatch("attObject", {});

    threescene.HIGHLIGHTED = null;
    return;
  }

  if (intersects.length > 0) {
    // eslint-disable-next-line
    if (threescene.HIGHLIGHTED != intersects[0].object) {
      if (threescene.HIGHLIGHTED)
        threescene.HIGHLIGHTED.material.emissive.setHex(
          threescene.HIGHLIGHTED.currentHex
        );

      threescene.HIGHLIGHTED = intersects[0].object;
      threescene.HIGHLIGHTED.currentHex = threescene.HIGHLIGHTED.material.emissive.getHex();
      threescene.HIGHLIGHTED.material.emissive.setHex(0xffffff);
      threescene.HIGHLIGHTED.material.emissiveIntensity = 0.25;
    }
  } else {
    if (threescene.HIGHLIGHTED)
      threescene.HIGHLIGHTED.material.emissive.setHex(
        threescene.HIGHLIGHTED.currentHex
      );

    threescene.HIGHLIGHTED = null;
  }

  EventEmitter.dispatch("attObjectTitle", {
    title: intersects[0].object.name,
    type: intersects[0].object.CityObjectClass
  });

  var cityObjectType = intersects[0].object.CityObjectClass;

  switch (cityObjectType) {
    case "Road":
    case "Railway":
    case "TransportSquare":
      cityObjectType = "Transportation";
      break;
    case "TunnelPart":
      cityObjectType = "Tunnel";
      break;
    case "BridgePart":
      cityObjectType = "Bridge";
      break;
    case "BridgeConstructionElement":
      cityObjectType = "BridgeInstallation";
      break;
    default:
  }

  axios
    .get("http://localhost:3001/measur3d/getObjectAttributes", {
      params: {
        name: intersects[0].object.name,
        CityObjectClass: cityObjectType
      }
    })
    .then(response => {
      EventEmitter.dispatch("attObject", response.data.attributes);
    });

  return intersects[0].object.name;
}
