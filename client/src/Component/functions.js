/*
This file comes mainly from the 3D GeoInformaiton Group from TU Delft
Code is available on https://github.com/tudelft3d/CityJSON-viewer/

It has been slightly modified to handle React components and integrated within the MERN app.
*/
import * as THREE from "three";
import * as earcut from "./earcut";

//convert CityObjects to mesh and add them to the viewer
export async function loadCityObjects(json, jsonName, geoms, meshes, scene, camera, controls) {

  //console.log("TODO: REMOVE NORMGEOM");
  //create one geometry that contains all vertices (in normalized form)
  //normalize must be done for all coordinates as otherwise the objects are at same pos and have the same size
  var normGeom = new THREE.Geometry();

  for (var i = 0; i < json.vertices.length; i++) {
    var point = new THREE.Vector3(
      json.vertices[i][0],
      json.vertices[i][1],
      json.vertices[i][2]
    );
    normGeom.vertices.push(point);
  }

  normGeom.normalize();

  for (var i = 0; i < json.vertices.length; i++) {
    json.vertices[i][0] = normGeom.vertices[i].x;
    json.vertices[i][1] = normGeom.vertices[i].y;
    json.vertices[i][2] = normGeom.vertices[i].z;
  }

  var stats = getStats(json.vertices);
  var minX = stats[0];
  var minY = stats[1];
  var minZ = stats[2];
  var avgX = stats[3];
  var avgY = stats[4];
  var avgZ = stats[5];

  camera.position.set(0, 0, 2);
  camera.lookAt(avgX, avgY, avgZ);

  controls.target.set(avgX, avgY, avgZ);

  //enable movement parallel to ground
  controls.screenSpacePanning = true;

  //count number of objects
  var totalco = Object.keys(json.CityObjects).length;
  console.log("Total # City Objects: ", totalco);

  //create dictionary
  var children = {};

  //iterate through all cityObjects
  for (var cityObj in json.CityObjects) {
    try {
      //parse cityObj that it can be displayed in three js
      var returnChildren = await parseObject(cityObj, json, jsonName, geoms);

      //if object has children add them to the childrendict
      for (var i in returnChildren) {
        children[jsonName + "_" + returnChildren[i]] = cityObj;
      }
    } catch (e) {
      console.log("ERROR at creating: " + cityObj);
      continue;
    }

    //set color of object
    var coType = json.CityObjects[cityObj].type;
    var material = new THREE.MeshLambertMaterial();
    material.color.setHex(ALLCOLOURS[coType]);

    //create mesh
    //geoms[cityObj].normalize()
    var _id = jsonName + "_" + cityObj;
    var coMesh = new THREE.Mesh(geoms[_id], material);
    coMesh.name = cityObj;
    coMesh.jsonName = jsonName;
    coMesh.castShadow = true;
    coMesh.receiveShadow = true;
    scene.add(coMesh);
    meshes.push(coMesh);
  }
}

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

//not used can be deleted prob
function sortVert(pList, type) {
  // Array of points;
  const points = [];
  for (var i = 0; i < pList.length; i = i + 3) {
    points.push({
      x: pList[i],
      y: pList[i + 1],
      z: pList[i + 2]
    });
  }

  // Find min max to get center
  // Sort from top to bottom
  points.sort((a, b) => a.y - b.y);

  // Get center y
  const cy = (points[0].y + points[points.length - 1].y) / 2;

  // Sort from right to left
  points.sort((a, b) => b.x - a.x);

  // Get center x
  const cx = (points[0].x + points[points.length - 1].x) / 2;

  // Center point
  const center = {
    x: cx,
    y: cy
  };

  // Starting angle used to reference other angles
  var startAng;
  points.forEach(point => {
    var ang = Math.atan2(point.y - center.y, point.x - center.x);
    if (!startAng) {
      startAng = ang;
    } else {
      if (ang < startAng) {
        // ensure that all points are clockwise of the start point
        ang += Math.PI * 2;
      }
    }
    point.angle = ang; // add the angle to the point
  });

  if (type == "cw") {
    // Sort clockwise;
    points.sort((a, b) => a.angle - b.angle);
  } else if (type == "ccw") {
    // first sort clockwise
    points.sort((a, b) => a.angle - b.angle);

    // then reverse the order
    points = points.reverse();

    // move the last point back to the start
    points.unshift(points.pop());
  }
  pList = [];

  for (i = 0; i < points.length; i++) {
    pList.push(points[i].x);
    pList.push(points[i].y);
    pList.push(points[i].z);
  }

  return pList;
}

//-- calculate normal of a set of points
function get_normal_newell(indices) {
  // find normal with Newell's method
  var n = [0.0, 0.0, 0.0];

  for (var i = 0; i < indices.length; i++) {
    var nex = i + 1;
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
async function parseObject(cityObj, json, jsonName, geoms) {
  var boundaries;

  if (json.CityObjects[cityObj].children != undefined) {
    return json.CityObjects[cityObj].children;
  }

  //create geometry and empty list for the vertices
  var geom = new THREE.Geometry();

  //each geometrytype must be handled different
  var geomType = json.CityObjects[cityObj].geometry[0].type;
  if (geomType == "Solid") {
    boundaries = json.CityObjects[cityObj].geometry[0].boundaries[0];
  } else if (geomType == "MultiSurface" || geomType == "CompositeSurface") {
    boundaries = json.CityObjects[cityObj].geometry[0].boundaries;
  } else if (geomType == "MultiSolid" || geomType == "CompositeSolid") {
    boundaries = json.CityObjects[cityObj].geometry[0].boundaries;
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

    /*
    console.log("Vert", vertices);
    console.log("Indi", indices);
    console.log("bound", boundary);
    console.log("geom", geom.vertices);
    */

    //create face
    //triangulated faces
    if (boundary.length == 3) {
      geom.faces.push(new THREE.Face3(boundary[0], boundary[1], boundary[2]));

      //non triangulated faces
    } else if (boundary.length > 3) {
      //create list of points
      var pList = [];
      for (var j = 0; j < boundary.length; j++) {
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
      for (var j = 0; j < pList.length; j++) {
        var re = await to_2d(pList[j], normal);
        pv.push(re.x);
        pv.push(re.y);
      }

      //triangulate
      var tr = await earcut(pv, null, 2);

      //create faces based on triangulation
      for (var j = 0; j < tr.length; j += 3) {
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

  //add geom to the list
  var _id = jsonName + "_" + cityObj;
  geoms[_id] = geom;

  return "";
}
