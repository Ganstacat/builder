import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui'; 
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

import {Stage} from './Stage.js';
import {FloorPlannerStage} from './FloorPlannerStage.js';
import {DragEnginePlane} from './DragEnginePlane.js';
import {MaterialManager} from './MaterialManager.js';
import {MainController} from './MainController.js';
import {ExportManager} from './ExportManager.js';
import {addListeners} from './addListeners.js';
import {addKeyboardControls} from './addKeyboardControls.js';

const dragEngine = new DragEnginePlane();

const assetLoader = new GLTFLoader();
const exporter = new GLTFExporter();
const exportManager = new ExportManager(exporter, assetLoader);
const mainController = new MainController(dragEngine, exportManager);

const builderStage = new Stage();
const floorStage = new FloorPlannerStage();

mainController.registerStage("builder", builderStage);
mainController.registerStage("floorPlanner", floorStage);
mainController.setCurrentStage("builder");


const textureLoader = new THREE.TextureLoader();
const materialManager = new MaterialManager(textureLoader);

addListeners(mainController);
addKeyboardControls(mainController);






// document.querySelector("#exportToFloor").onclick = function(){

	// exporter.parse(
		// builderStage.movableObjects,
		// function ( result ) {
			// saveArrayBuffer(result,'Scene.glb');
		// },
		// function (error) {
			// console.log("An error occured when exporting! : " + error);
		// },
		// {
			// binary:true
		// }
	// );
	
	
// }
// function saveArrayBuffer(buffer, filename){
	// save(new Blob([buffer], {type:'application/octet-stream'}), filename);
// }
// function save(blob, filename) {
	// link.href = URL.createObjectURL(blob);
	
	// assetLoader.load(link.href, function(gltf){
		// const model = gltf.scene;
		// console.log(model);
		// for(let child of model.children){
			// child.castShadow = true;
		// }
		// floorStage.scene.add(model);
		// floorStage.movableObjects.push(model);
		// model.position.set(0,0,0);
		
	// }, undefined, function(error){
		// console.log(error);
	// }); 
	
	// link.download = filename;
	// // link.click();
// }
// const link = document.createElement('a');
// document.body.appendChild(link);





const materialSelector = document.querySelector("#materials");
materialSelector.onchange = function(e) {
	console.log(materialSelector.value);
	if (currentStage.selectedObject && currentStage.selectedObject.isMesh)
		materialManager.setMeshTexture(currentStage.selectedObject, materialSelector.value);
	else if (currentStage.selectedObject){
		applyToChildMeshes(currentStage.selectedObject, (o)=>{materialManager.setMeshTexture(o, materialSelector.value);});
	}
}

// function saveArrayBuffer(buffer, filename){
	// save(new Blob([buffer], {type:'application/octet-stream'}), filename);
// }
// function save(blob, filename) {
	// link.href = URL.createObjectURL(blob);
	
	// assetLoader.load(link.href, function(gltf){
		// const model = gltf.scene;
		// console.log(model);
		// for(let child of model.children){
			// child.castShadow = true;
		// }
		// floorStage.scene.add(model);
		// floorStage.movableObjects.push(model);
		// model.position.set(0,0,0);
		
	// }, undefined, function(error){
		// console.log(error);
	// }); 
	
	// link.download = filename;
	// // link.click();
// }
// const link = document.createElement('a');
// document.body.appendChild(link);







// var wood;

// textureLoader.load(
	// './assets/textures/seamless-01.jpg',
	// function ( texture ) {
		// wood = new THREE.MeshBasicMaterial( { map: texture} );
	// }, 
	// undefined,
	// function (err){
		// console.log(err);
	// }
// );
// const box = builderStage.meshFactory.createRestrainedMesh(
	// new THREE.BoxGeometry(0.5,0.5,0.5),
	// new THREE.MeshStandardMaterial({ map: textureLoader.load('./assets/textures/wood1.jpg') }),
	// true, true, builderStage.constraintBox
// );
// const box = builderStage.meshFactory.createRestrainedMesh(
	// new THREE.BoxGeometry(0.5,0.5,0.5),
	// materialManager.materials.light_brick(),
	// true, true, builderStage.constraintBox
// );

const box = builderStage.meshFactory.createRestrainedMesh(
	new THREE.BoxGeometry(0.5,0.5,0.5),
	new THREE.MeshStandardMaterial(),
	true, true, builderStage.constraintBox
);
// const mat = materialManager.materials.light_brick();
// box.material = mat;
console.log(box);

// const gridHelper = new THREE.GridHelper(4, 16);
// stage.scene.add(gridHelper);
// let constraintBox = new THREE.Box3(
	// new THREE.Vector3(-1.5, 0,-1.5),
	// new THREE.Vector3( 1.5, 0.5, 1.5)
// );
// const helperbox = new THREE.Box3Helper(constraintBox, "orange");
// stage.scene.add(helperbox);
// const box = stage.meshFactory.createRestrainedMesh(
	// new THREE.BoxGeometry(0.5,0.5,0.5),
	// new THREE.MeshStandardMaterial(),
	// true, true, constraintBox
// );
// box.position.y -= box.geometry.boundingBox.min.y;







// console.log(box);
// const box2 = meshFactory.createRestrainedMesh(
	// new THREE.BoxGeometry(0.5,0.5,0.5),
	// new THREE.MeshStandardMaterial({side: THREE.DoubleSide}),
	// true, true, constraintBox
// );
// box2.position.y -= box2.geometry.boundingBox.min.y;
// box2.position.x = 1;


