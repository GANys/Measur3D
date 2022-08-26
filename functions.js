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
  Railway: 0x222222,
  Road: 0x999999,
  SolitaryVegetationObject: 0x197319,
  TINRelief: 0x3fd43f,
  TransportSquare: 0x999999,
  Tunnel: 0x999999,
  TunnelPart: 0x999999,
  TunnelInstallation: 0x999999,
  WaterBody: 0x4da6ff,
};

var SURFACECOLOURS = {
  GroundSurface: 0x999999,
  WallSurface: 0xffffff,
  RoofSurface: 0xff0000,
  TrafficArea: 0x6e6e6e,
  AuxiliaryTrafficArea: 0x2c8200,
  Window: 0x0059ff,
  Door: 0x640000
};

var ROADCOLOURS = {
  sidewalk: 0xC9CBC9,
  road: 0x848784,
  'green areas': 0x32AC2E
}

//convert CityObjects to mesh and add them to the viewer
export async function loadCityObjects(threescene, cm_name) {
  await axios
    .get("http://localhost:3001/measur3d/getNamedCityModel", {
      params: {
        name: cm_name,
      },
    })
    .then(async (responseCity) => {
      var json = responseCity.data;

      var ext = json.metadata.geographicalExtent;
      var avgX = (ext[0] + ext[3]) / 2;
      var avgY = (ext[1] + ext[4]) / 2;
      var avgZ = (ext[2] + ext[5]) / 2;

      var z_dist = (ext[3] - ext[0]) / (2 * Math.tan((30 * Math.PI) / 180));
      var y_dist = (ext[3] - ext[0]) / (2 * Math.tan((30 * Math.PI) / 180));

      threescene.camera.position.set(avgX, avgY - y_dist, avgZ + z_dist); // Can be improved
      threescene.camera.lookAt(avgX, avgY, avgZ);

      threescene.camera.updateProjectionMatrix();

      threescene.controls.target.set(avgX, avgY, avgZ);

      //enable movement parallel to ground
      threescene.controls.screenSpacePanning = true;

      //iterate through all cityObjects
      for (var cityObj in json.CityObjects) {
        var boundaries = json.CityObjects[cityObj].geometry[0].boundaries;
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

        var childrenMeshes = [];

        var surfaces = json.CityObjects[cityObj].geometry[0].semantics.surfaces;
        var values = json.CityObjects[cityObj].geometry[0].semantics.values;

        var idx = 0;
        //parse cityObj that it can be displayed in three js
        boundaries.forEach(surface => {
          var returnChildren = parseSurface(
            json.CityObjects[cityObj],
            surface,
            json.transform,
            cityObj,
            threescene.geoms
          );

          var color;
          var type;

          //if object has children add them to the childrendict
           for (var i in returnChildren) {
            childrenMeshes.push(returnChildren[i]);
          }

          var value = values[idx];
          if (value !== null) {
            type = surfaces[value].function;
            color = ROADCOLOURS[type];
          } else {
            type = json.CityObjects[cityObj].type;
            color = ALLCOLOURS[type];
          }


          //set color of object
          var material = new THREE.MeshStandardMaterial();
          material.color.setHex(color);

          //create mesh
          var coMesh = new THREE.Mesh(threescene.geoms[surface], material);

          // Added by Measur3D
          coMesh.name = cityObj;
          coMesh.CityObjectClass = json.CityObjects[cityObj].type;
          coMesh.jsonName = json.name;

          if (value !== null) {
            coMesh.type = surfaces[value].type;
            coMesh.function = surfaces[value].function;
            coMesh.surfaceMaterial = surfaces[value].surfaceMaterial;
          }

          coMesh.childrenMeshes = childrenMeshes;

          coMesh.castShadow = true;
          coMesh.receiveShadow = true;
          threescene.scene.add(coMesh);
          threescene.meshes.push(coMesh);

          idx++;
        })       
      }
    })
    .then(() => {
      threescene.setState({
        boolJSONload: false, //enable clicking functions
        cityModel: true,
      });

      threescene.renderer.render(threescene.scene, threescene.camera);
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

//convert json file to viewer-object
async function parseSurface(object, surface, transform, cityObj, geoms) {
  // CityObject JSON, transform, CityObject name, threeScene.Geoms
  if (object["pointcloud-file"] !== undefined) console.log(object["pointcloud-file"])

  //create geometry and empty list for the vertices
  var geom = new THREE.Geometry();

  if (object.geometry[0] == null) return; // If no geometry (eg: CityObjectGroup (not always true))

  //each geometrytype must be handled different
  var geomType = object.geometry[0].type;

  var object_vertices = object.vertices;
  var face_vertices = [];

  var boundaries = object.geometry[0].boundaries;

    var boundary = [],
        holes = []
        if (boundary.length > 0) {
          holes.push(boundary.length);
        }

          var new_boundary = decomposeFaces(
            geom,
            surface[0],
            face_vertices,
            object_vertices,
            transform
          );
          boundary.push(...new_boundary);
      
      
      if (boundary.length === 3) {
        geom.faces.push(new THREE.Face3(boundary[0], boundary[1], boundary[2]));
      } else if (boundary.length > 3) {
        //create list of points
        var pList = [],
          k;

        for (k = 0; k < boundary.length; k++) {
          pList.push({
            x: object_vertices[face_vertices[boundary[k]]][0],
            y: object_vertices[face_vertices[boundary[k]]][1],
            z: object_vertices[face_vertices[boundary[k]]][2],
          });
        }
        //get normal of these points
        var normal = get_normal_newell(pList);

        //convert to 2d (for triangulation)
        var pv = [];
        for (k = 0; k < pList.length; k++) {
          var re = to_2d(pList[k], normal);
          pv.push(re.x);
          pv.push(re.y);
        }

        //triangulate
        var tr = earcut(pv, holes, 2);

        //create faces based on triangulation
        for (k = 0; k < tr.length; k += 3) {
          geom.faces.push(
            new THREE.Face3(
              boundary[tr[k]],
              boundary[tr[k + 1]],
              boundary[tr[k + 2]]
            )
          );
        }
      }
    

    //needed for shadow
    geom.computeFaceNormals();
    //geom.computeVertexNormals();

    geoms[surface] = geom;
  

  return object.children;
}

function decomposeFaces(geom, boundary, indices, vertices, transform) {
  var new_boundary = [];
  var j;
  for (j = 0; j < boundary.length; j++) {
    //the original index from the json file
    var index = boundary[j];

    //if this index is already there
    if (indices.includes(index)) {
      var vertPos = indices.indexOf(index);
      new_boundary.push(vertPos);
    } else {
      // Add vertex to geometry
      if (transform !== undefined) {
        var point = new THREE.Vector3(
          vertices[index][0] * transform.scale[0] + transform.translate[0],
          vertices[index][1] * transform.scale[1] + transform.translate[1],
          vertices[index][2] * transform.scale[2] + transform.translate[2]
        );
      } else {
        point = new THREE.Vector3(
          vertices[index][0],
          vertices[index][1],
          vertices[index][2]
        );
      }
      geom.vertices.push(point);

      new_boundary.push(indices.length);
      indices.push(index);
    }
  }
  return new_boundary;
}

//action if mouseclick (for getting attributes ofobjects)
export async function intersectMeshes(event, threescene) {
  //if no cityjson is loaded return
  // eslint-disable-next-line
  if (threescene.state.cityModel == false) {
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
    if (threescene.HIGHLIGHTED !== null) {
      if (threescene.HIGHLIGHTED.material.emissive !== undefined) {
        threescene.HIGHLIGHTED.material.emissive.setHex(
          threescene.HIGHLIGHTED.currentHex
        );
      } else {
        threescene.HIGHLIGHTED.material.color.setHex(
          threescene.HIGHLIGHTED.currentHex
        );
      }
    }

    var action_button = document.querySelectorAll("div > div > span > button");

    action_button.forEach(function (button) {
      button.style.visibility = "hidden";
    });

    EventEmitter.dispatch("attObjectTitle", ("Object attributes", null));
    EventEmitter.dispatch("attObject", {});

    threescene.HIGHLIGHTED = null;
    return;
  }

  if (intersects.length > 0) {
    // eslint-disable-next-line
    if (threescene.HIGHLIGHTED !== intersects[0].object) {
      if (threescene.HIGHLIGHTED !== null) {
        if (threescene.HIGHLIGHTED.material.emissive !== undefined) {
          threescene.HIGHLIGHTED.material.emissive.setHex(
            threescene.HIGHLIGHTED.currentHex
          );
        } else {
          threescene.HIGHLIGHTED.material.color.setHex(
            threescene.HIGHLIGHTED.currentHex
          );
        }
      }

      threescene.HIGHLIGHTED = intersects[0].object;

      if (threescene.HIGHLIGHTED.material.emissive !== undefined) {
        threescene.HIGHLIGHTED.currentHex = threescene.HIGHLIGHTED.material.emissive.getHex();
        threescene.HIGHLIGHTED.material.emissive.setHex(0xffff00);
        threescene.HIGHLIGHTED.material.emissiveIntensity = 0.3;
      } else {
        threescene.HIGHLIGHTED.currentHex = threescene.HIGHLIGHTED.material.color.getHex();
        threescene.HIGHLIGHTED.material.color.setHex(0xffff00);
      }
    }
  } else {
    if (threescene.HIGHLIGHTED !== null) {
      if (threescene.HIGHLIGHTED.material.emissive !== undefined) {
        threescene.HIGHLIGHTED.material.emissive.setHex(
          threescene.HIGHLIGHTED.currentHex
        );
      } else {
        threescene.HIGHLIGHTED.material.color.setHex(
          threescene.HIGHLIGHTED.currentHex
        );
      }
    }

    threescene.HIGHLIGHTED = null;
  }

  EventEmitter.dispatch("attObjectTitle", {
    title: intersects[0].object.name,
    type: intersects[0].object.CityObjectClass,
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


  var semantics = { 
    "type": intersects[0].object.type,
    "surfaceMaterial": intersects[0].object.surfaceMaterial,
    "function": intersects[0].object.function
  };

  axios
    .get("http://localhost:3001/measur3d/getObjectAttributes", {
      params: {
        name: intersects[0].object.name,
        CityObjectType: cityObjectType,
      },
    })
    .then((response) => {
      if (semantics.type !== "Mesh") {
        var data = extend(response.data.attributes, semantics);
      } else {
        var data = response.data.attributes;
      }
      EventEmitter.dispatch("attObject", data);
    });

  return intersects[0].object.name;
}

function extend(dest, src) { 
    for(var key in src) { 
        dest[key] = src[key]; 
    } 
    return dest; 
} 