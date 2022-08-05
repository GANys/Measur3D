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

// From https://doi.org/10.3390/ijgi10030138
export var ALLCOLOURS = {
  Building: 0x73726f,
  BuildingPart: 0x8f8b7e,
  BuildingInstallation: 0x615e54,
  Bridge: 0x757575,
  BridgePart: 0x4a4a4a,
  BridgeInstallation: 0x696969,
  BridgeConstructionElement: 0x7a7a7a,
  CityObjectGroup: 0x5a5f61,
  CityFurniture: 0x7b8285,
  GenericCityObject: 0xa5adb0,
  LandUse: 0x85837b,
  PlantCover: 0x687d5e,
  Railway: 0x594b3f,
  Road: 0x595654,
  SolitaryVegetationObject: 0x5e8c4c,
  TINRelief: 0x7a8774,
  TransportSquare: 0x5c5955,
  Tunnel: 0x454340,
  TunnelPart: 0x66635f,
  TunnelInstallation: 0x6b655c,
  WaterBody: 0x8bacb5,
};

//convert CityObjects to mesh and add them to the viewer
export async function loadCityModel(threescene, cm_uid) {
  await axios
    .get("http://localhost:3001/measur3d/getCityModel", {
      params: {
        cm_uid: cm_uid,
      },
    })
    .then(async (responseCity) => {
      var json = responseCity.data;

      var ext = json.metadata.geographicalExtent;

      const ext_min = new THREE.Vector3(ext[0], ext[1], ext[2]);
      const ext_max = new THREE.Vector3(ext[3], ext[4], ext[5]);
      const cityModelBBOX = new THREE.Box3(ext_min, ext_max);

      // Changes the UP vector to Z rather than Y
      threescene.camera.up = new THREE.Vector3(0, 0, 1);

      fitCameraToObject(
        threescene.camera,
        cityModelBBOX,
        1,
        threescene.controls
      );

      //enable movement parallel to ground
      threescene.controls.screenSpacePanning = true;

      //iterate through all cityObjects
      for (var cityObj in json.CityObjects) {
        var cityobjectType = json.CityObjects[cityObj].type;

        //parse cityObj that it can be displayed in three js
        var coMesh = await parseObject(json.CityObjects[cityObj]);

        //set color of object
        if (json.CityObjects[cityObj].geometry[0] == null) {
          console.log("No geometry for : " + cityObj);
        }

        // Added by Measur3D
        coMesh.uid = json.CityObjects[cityObj].uid;
        coMesh.CityObjectType = cityobjectType;
        // Cannot be called children because children are element of an Object3D#Group


        coMesh.castShadow = true;
        coMesh.receiveShadow = true;
        threescene.scene.add(coMesh);
      }
    })
    .then(() => {
      threescene.setState({
        boolJSONload: false, // enable clicking functions
        cityModel: true,
      });
    });
}

function fitCameraToObject(camera, boundingBox, offset, controls) {
  // Need to rework
  offset = offset || 1.25;

  const center = new THREE.Vector3();
  boundingBox.getCenter(center);

  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  // get the max side of the bounding box (fits to width OR height as needed )
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs((maxDim / 4) * Math.tan(fov * 2));

  cameraZ *= offset; // zoom out a little so that objects don't fill the screen

  camera.position.z = cameraZ;
  camera.position.x = center.x;

  const minZ = boundingBox.min.z;
  const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

  camera.far = cameraToFarEdge * 3;
  camera.updateProjectionMatrix();

  if (controls) {
    // set camera to rotate around center of loaded object
    controls.target = center;

    // prevent camera from zooming out far enough to create far plane cutoff
    controls.maxDistance = cameraToFarEdge * 2;

    controls.saveState();
  } else {
    camera.lookAt(center);
  }
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
async function parseObject(object) {
  return new Promise(async function (resolve, reject) {
    // CityObject JSON
    var boundaries;

    //create geometry
    var geom = new THREE.BufferGeometry();

    if (object.geometry[0] == null) return; // If no geometry (eg: CityObjectGroup (not always true))

    // Will be removed once concurent LoD are supported
    var lod = 0.0,
      id = -1.0;
    // Select higher LoD for each element
    for (var el in object.geometry) {
      if (Number(object.geometry[el].lod) > lod) {
        lod = Number(object.geometry[el].lod);
        id = el;
      }
    }

    var selected_geom = object.geometry[id];

    //each geometrytype must be handled different
    var geomType = selected_geom.type;

    for (var vertex in object.vertices) {
      object.vertices[vertex][0] =
        object.vertices[vertex][0] * object.transform.scale[0] +
        object.transform.translate[0];
      object.vertices[vertex][1] =
        object.vertices[vertex][1] * object.transform.scale[1] +
        object.transform.translate[1];
      object.vertices[vertex][2] =
        object.vertices[vertex][2] * object.transform.scale[2] +
        object.transform.translate[2];
    }

    if (geomType === "Solid") {
      boundaries = selected_geom.boundaries[0];
    } else if (geomType === "MultiSurface" || geomType === "CompositeSurface") {
      boundaries = selected_geom.boundaries;
    } else if (geomType === "MultiSolid" || geomType === "CompositeSolid") {
      boundaries = selected_geom.boundaries;
    }

    var geom_indices = [];

    for (var i = 0; i < boundaries.length; i++) {
      var boundary = [],
        holes = [];

      boundary = boundaries[i][0];

      if (boundary.length === 3) {
        geom_indices.push(boundary[0], boundary[1], boundary[2]);
      } else if (boundary.length > 3) {
        //create list of points
        var pList = [],
          vList = [],
          k;

        for (var j = 0; j < boundaries[i].length; j++) {
          for (k = 0; k < boundaries[i][j].length; k++) {
            pList.push({
              x: object.vertices[boundaries[i][j][k]][0],
              y: object.vertices[boundaries[i][j][k]][1],
              z: object.vertices[boundaries[i][j][k]][2],
            });

            if (j > 0 && k === 0) {
              holes.push(vList.length);
            }

            vList.push(boundaries[i][j][k]);
          }
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
        for (k = 0; k < tr.length; k += 1) {
          geom_indices.push(vList[tr[k]]);
        }
      }
    }

    geom.setIndex(
      new THREE.Uint32BufferAttribute(new Uint16Array(geom_indices), 1)
    );

    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([].concat.apply([], object.vertices), 3)
    );

    geom.computeVertexNormals();

    geom.computeBoundingBox();

    geom.boundaries = boundaries

    if (object.children !== undefined) geom.children = object.children;

    var material = new THREE.MeshPhongMaterial({vertexColors: true, color: new THREE.Color(ALLCOLOURS[object.type])});

    var coMesh = new THREE.Mesh(geom, material);

    coMesh.childrenMeshes = geom.children;

    var positionAttribute = geom.getAttribute("position");

    const colors = [];

    const color = new THREE.Color(ALLCOLOURS[object.cityobjectType]);
    for (let i = 0; i < positionAttribute.count; i += 3) {
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    }

    coMesh.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    resolve(coMesh);
  });
}

//action if mouseclick (for getting attributes of objects)
export function intersectMeshes(event, threescene) {
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

  var mesh = new THREE.Mesh();

  var meshes = threescene.scene.children.filter(
    (value) => value.type === mesh.type
  );

  //calculate intersects
  var intersects = threescene.raycaster.intersectObjects(meshes);

  //if clicked on nothing return
  // eslint-disable-next-line
  if (intersects.length == 0) {
    threescene.updateSelection()

    var action_button = document.querySelectorAll("div > div > span > button");

    action_button.forEach(function (button) {
      button.style.visibility = "hidden";
    });

    EventEmitter.dispatch("attObjectTitle", ("Object attributes", null));
    EventEmitter.dispatch("attObject", {});

    threescene.selectedObj = null;
    return;
  }

  /*

  if (intersects.length > 0) {
    // eslint-disable-next-line
    if (threescene.selectedObj != intersects[0].object) {
      if (threescene.selectedObj !== null) {
        if (threescene.selectedObj.material.emissive !== undefined) {
          threescene.selectedObj.material.emissive.setHex(
            threescene.selectedObj.currentHex
          );
        } else {
          threescene.selectedObj.material.color.setHex(
            threescene.selectedObj.currentHex
          );
        }
      }

      threescene.selectedObj = intersects[0].object;

      if (threescene.selectedObj.material.emissive !== undefined) {
        threescene.selectedObj.currentHex = threescene.selectedObj.material.emissive.getHex();
        threescene.selectedObj.material.emissive.setHex(0xffffff);
        threescene.selectedObj.material.emissiveIntensity = 0.2;
      } else {
        threescene.selectedObj.currentHex = threescene.selectedObj.material.color.getHex();
        threescene.selectedObj.material.color.setHex(0xffffff);
      }
    }
  } else {
    if (threescene.selectedObj !== null) {
      if (threescene.selectedObj.material.emissive !== undefined) {
        threescene.selectedObj.material.emissive.setHex(
          threescene.selectedObj.currentHex
        );
      } else {
        threescene.selectedObj.material.color.setHex(
          threescene.selectedObj.currentHex
        );
      }
    }

    threescene.selectedObj = null;
  }

  */

  threescene.updateSelection(intersects[0]);

  // HERE

  // Used in Ninja to handle LoDs
  //const { face, object } = getActiveIntersection(intersects);
  /*
  const { face, object } = intersects[0];

  const objIds = object.geometry.getAttribute("objectid");
  if (objIds) {
    const idx = objIds.getX(face.a);
    const geomId = object.geometry.getAttribute("geometryid").getX(face.a);
    const boundId = object.geometry.getAttribute("boundaryid").getX(face.a);
    const objectId = Object.keys(this.citymodel.CityObjects)[idx];
    this.$emit("object_clicked", [objectId, geomId, boundId]);
  }
  */

  EventEmitter.dispatch("attObjectTitle", {
    title: intersects[0].object.uid,
    type: intersects[0].object.CityObjectType,
  });

  var cityObjectType = intersects[0].object.CityObjectType;

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
        uid: intersects[0].object.uid,
        CityObjectType: cityObjectType,
      },
    })
    .then((response) => {
      EventEmitter.dispatch("attObject", response.data.attributes);
    });
}

/* Keep it for better LoD support
function getActiveIntersection(results) {
  // Filters through the results to find the first one for the active LoD
  if (this.activeLod > -1) {
    for (let i = 0; i < results.length; i++) {
      const { face, object } = results[i];
      const lodIdx = object.geometry.getAttribute("lodid").getX(face.a);
      if (lodIdx == this.activeLod) {
        return results[i];
      }
    }
  }
  return results[0];
}
*/
