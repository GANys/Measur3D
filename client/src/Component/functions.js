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
export async function loadCityObjects(threescene, cm_name) {
  await axios
    .get("http://localhost:3001/measur3d/getNamedCityModel", {
      params: {
        name: cm_name
      }
    })
    .then(async responseCity => {
      var json = responseCity.data;

      var ext = json.metadata.geographicalExtent;
      var avgX = (ext[0] + ext[3]) / 2;
      var avgY = (ext[1] + ext[4]) / 2;
      var avgZ = (ext[2] + ext[5]) / 2;

      threescene.camera.position.set(0, 0, avgZ * 1.2 );
      threescene.camera.lookAt(avgX, avgY, avgZ);

      threescene.camera.updateProjectionMatrix();

      threescene.controls.target.set(avgX, avgY, avgZ);

      //enable movement parallel to ground
      threescene.controls.screenSpacePanning = true;

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

        var childrenMeshes = [];

        try {
          //parse cityObj that it can be displayed in three js
          var returnChildren = await parseObject(
            json.CityObjects[cityObj],
            json.transform,
            cityObj,
            threescene.geoms
          );

          //if object has children add them to the childrendict
          for (var i in returnChildren) {
            childrenMeshes.push(returnChildren[i]);
          }
        } catch (e) {
          var error_message = "ERROR at creating: " + cityObj;
          console.log(error_message);
          EventEmitter.dispatch("error", error_message);
          continue;
        }

        //set color of object
        var coType = json.CityObjects[cityObj].type;
        var material = new THREE.MeshLambertMaterial();
        material.color.setHex(ALLCOLOURS[coType]);

        //create mesh
        var coMesh = new THREE.Mesh(threescene.geoms[cityObj], material);

        // Added by Measur3D
        coMesh.name = cityObj;
        coMesh.CityObjectClass = json.CityObjects[cityObj].type;
        coMesh.jsonName = json.name;
        coMesh.childrenMeshes = childrenMeshes;

        coMesh.castShadow = true;
        coMesh.receiveShadow = true;
        threescene.scene.add(coMesh);
        threescene.meshes.push(coMesh);
      }
    })
    .then(() => {
      threescene.setState({
        boolJSONload: false, //enable clicking functions
        cityModel: true
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
  return b;
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
  var y3 = n.clone();
  y3.cross(x3);
  let x = p.dot(x3);
  let y = p.dot(y3);
  var re = { x: x, y: y };
  return re;
}

//convert json file to viwer-object
async function parseObject(object, transform, cityObj, geoms) {
  // CityObject, CityObject.name, threeScene.Geoms
  var boundaries;

  //create geometry and empty list for the vertices
  var geom = new THREE.Geometry();

  if (object.geometry[0] == null) return; // If no geometry (eg: CityObjectGroup (not always true))

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

  var vertices = object.vertices;

  for (var ver in vertices) {
    if (transform !== undefined) {
      var point = new THREE.Vector3(
        vertices[ver][0] * transform["scale"][0] + transform["translate"][0],
        vertices[ver][1] * transform["scale"][1] + transform["translate"][1],
        vertices[ver][2] * transform["scale"][2] + transform["translate"][2]
      );
    } else {
      point = new THREE.Vector3(
        vertices[ver][0],
        vertices[ver][1],
        vertices[ver][2]
      );
    }
    geom.vertices.push(point);
  }

  for (var i = 0; i < boundaries.length; i++) {
    //boundaries[i] is a local face

    //create face
    //triangulated faces
    if (boundaries[i][0].length === 3) {
      geom.faces.push(
        new THREE.Face3(
          boundaries[i][0][0],
          boundaries[i][0][1],
          boundaries[i][0][2]
        )
      );

      //non triangulated faces
    } else if (boundaries[i][0].length > 3) {
      //create list of points
      var pList = [];
      for (var j = 0; j < boundaries[i][0].length; j++) {
        pList.push({
          x: vertices[boundaries[i][0][j]][0],
          y: vertices[boundaries[i][0][j]][1],
          z: vertices[boundaries[i][0][j]][2]
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
            boundaries[i][0][tr[j]],
            boundaries[i][0][tr[j + 1]],
            boundaries[i][0][tr[j + 2]]
          )
        );
      }
    }
  }

  //needed for shadow
  geom.computeFaceNormals();

  geoms[object.name] = geom;

  return object.children;
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
    if (threescene.HIGHLIGHTED)
      threescene.HIGHLIGHTED.material.emissive.setHex(
        threescene.HIGHLIGHTED.currentHex
      );

    var add_attribute_button = document.querySelector(
      "div.MuiToolbar-root.MuiToolbar-regular.MTableToolbar-root-75.MuiToolbar-gutters > div.MTableToolbar-actions-78"
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
        CityObjectType: cityObjectType
      }
    })
    .then(response => {
      EventEmitter.dispatch("attObject", response.data.attributes);
    });

  return intersects[0].object.name;
}
