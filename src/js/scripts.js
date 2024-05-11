import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui'; 
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

import  {Stage} from './Stage.js';
import  {FloorPlannerStage} from './FloorPlannerStage.js';
import  {DragEnginePlane} from './DragEnginePlane.js';
import  {MaterialManager} from './MaterialManager.js';




const builderStage = new Stage();
const floorStage = new FloorPlannerStage();
var currentStage = builderStage;

const textureLoader = new THREE.TextureLoader();
const materialManager = new MaterialManager(textureLoader);
const assetLoader = new GLTFLoader();

const exporter = new GLTFExporter();
const dragEngine = new DragEnginePlane(builderStage);
const gui = new dat.GUI();

var selectedObject;
function setScale(obj,x,y,z){
	if(!obj) return;
	if (obj.constructor.name === "RestrainedMesh") obj.setScale(x,y,z);
	else obj.scale.set(x,y,z);
}
function setRotation(obj,x,y,z){
	if(!obj) return;
	obj.rotation.x = x; obj.rotation.y = y; obj.rotation.z = z;
}
function removeSelectionColor(obj) {
	if(obj.isMesh) obj.material.emissive.set("black");
	else if (obj.isGroup) {
		applyToChildMeshes(obj, function(o){ 
			removeSelectionColor(o);
		});
	}
	
}
function applySelectionColor(obj){
	if(obj.isMesh) obj.material.emissive.set(0x9c8e30);
	else if (obj.isGroup) {
		applyToChildMeshes(obj, function(o){
			applySelectionColor(o);
		});
	}
	
}
function applyToChildMeshes(group, cb, ...args) {
	for (let i = 0; i < group.children.length; i++) {
		let child = group.children[i];
		if (child.isGroup) applyToChildMeshes(child, cb);
		else cb(child, args);
	}
}


const options = {
	scalex:1,
	scaley:1,
	scalez:1,
	
	rotationx:0,
	rotationy:0,
	rotationz:0,
	
	color: 0xFFFFFF

};
gui.add(options, 'scalex',0.1, 10).listen().onChange((e)=>{setScale(selectedObject, options.scalex, options.scaley, options.scalez );});
gui.add(options, 'scaley',0.1, 10).listen().onChange((e)=>{setScale(selectedObject, options.scalex, options.scaley, options.scalez );});
gui.add(options, 'scalez',0.1, 10).listen().onChange((e)=>{setScale(selectedObject, options.scalex, options.scaley, options.scalez );});
gui.add(options, 'rotationx',0, Math.PI, Math.PI/4).listen().onChange((e)=>{
	setRotation(selectedObject, options.rotationx, options.rotationy, options.rotationz);
});
gui.add(options, 'rotationy',0, Math.PI, Math.PI/4).listen().onChange((e)=>{
	setRotation(selectedObject, options.rotationx, options.rotationy, options.rotationz);
});
gui.add(options, 'rotationz',0, Math.PI, Math.PI/4).listen().onChange((e)=>{
	setRotation(selectedObject, options.rotationx, options.rotationy, options.rotationz);
});
gui.addColor(options, 'color').onChange(function(e){
	selectedObject.material.color.set(e);
});
document.addEventListener('pointerdown', function(){
	
	
	if (selectedObject)
		removeSelectionColor(selectedObject);
	
	if(dragEngine.dragObject) {
		selectedObject = dragEngine.dragObject;
	} else {
		// по сути два раза смотрим пересечения с объектами. Нот грейт.
		let obj = dragEngine.selectObject(currentStage.scene.children);
		if (obj) selectedObject = obj;
	}
	
	
	
	if (selectedObject) {
		applySelectionColor(selectedObject);
		updateSelectedObject();
	}
});
function updateSelectedObject(){
	if(selectedObject){
		options.scalex = selectedObject.scale.x;
		options.scaley = selectedObject.scale.y;
		options.scalez = selectedObject.scale.z;
		
		options.rotationx = selectedObject.rotation.x;
		options.rotationy = selectedObject.rotation.y;
		options.rotationz = selectedObject.rotation.z;
	}
	gui.updateDisplay();
}

let keyboardScaleAxis = "y";
document.addEventListener('keypress', (e) => {
	switch (e.key) {
		case "4":
			selectedObject.position.x -= 0.1;
			break;
		case "6":
			selectedObject.position.x += 0.1;
			break;
		case "2":
			selectedObject.position.z -= 0.1;
			break;
		case "8":
			selectedObject.position.z += 0.1;
			break;
		case "3":
			selectedObject.position.y -= 0.1;
			break;
		case "9":
			selectedObject.position.y += 0.1;
			break;
		case "7":
			keyboardScaleAxis = "y";
			break;
		case "1":
			keyboardScaleAxis = "x";
			break;		
		case "5":
			keyboardScaleAxis = "z";
			break;
		case "+":
			switch (keyboardScaleAxis) {
				case "x":
					selectedObject.scale.x += 0.1;
					break;
				case "y":
					selectedObject.scale.y += 0.1;
					break;
				case "z":
					selectedObject.scale.z += 0.1;
					break;
			}
			break;
		case "-":
			switch (keyboardScaleAxis) {
				case "x":
					selectedObject.scale.x -= 0.1;
					break;
				case "y":
					selectedObject.scale.y -= 0.1;
					break;
				case "z":
					selectedObject.scale.z -= 0.1;
					break;
			}
			break;
		case "q":
			if(selectedObject){
				removeSelectionColor(selectedObject);
				selectedObject = null;
			}
			break;
	}
	updateSelectedObject();
	if(selectedObject && selectedObject.isRestrainedMesh){
		selectedObject.adjustRestraintForScale();
		dragEngine.applyRestraint(selectedObject);
	}
});


document.querySelector("#floorPlanner").onclick = function(){	
	builderStage.hideScene();
	floorStage.showScene();
	dragEngine.setStage(floorStage);
	currentStage = floorStage;
};
document.querySelector("#builder").onclick = function(){
	floorStage.hideScene();
	builderStage.showScene();
	dragEngine.setStage(builderStage);
	currentStage = builderStage;
}
document.querySelector("#exportToFloor").onclick = function(){
	for(let obj of builderStage.movableObjects)
		removeSelectionColor(obj);
	
	exporter.parse(
		builderStage.movableObjects,
		function ( result ) {
			saveArrayBuffer(result,'Scene.glb');
		},
		function (error) {
			console.log("An error occured when exporting! : " + error);
		},
		{
			binary:true
		}
	)
}
document.querySelector("#addCube").onclick = function(){
	let box = builderStage.meshFactory.createRestrainedMesh(
		new THREE.BoxGeometry(0.5,0.5,0.5),
		new THREE.MeshStandardMaterial({side: THREE.DoubleSide}),
		true, true, builderStage.constraintBox
	);
	box.position.y -= box.geometry.boundingBox.min.y;
}
document.querySelector("#clone").onclick = function(){
	if (selectedObject) {
		removeSelectionColor(selectedObject);
		let newObject;
		if (selectedObject.isRestrainedMesh) {
			newObject = currentStage.meshFactory.cloneRestrainedMesh(selectedObject);
		} else if (selectedObject.isMesh) {
			newObject = currentStage.meshFactory.cloneMesh(selectedObject);
		} else if (selectedObject.isGroup) {
			
			newObject = new THREE.Group();
			applyToChildMeshes(selectedObject, function (o){
				if(o.isRestrainedMesh) newObject.add(currentStage.meshFactory.cloneRestrainedMesh(o));
				else if(o.isMesh) newObject.add(currentStage.meshFactory.cloneMesh(o));
			});
			
			currentStage.addObject(newObject, true, false);
		}
		else {
			console.log("Cannot create clone for an object: ");
			console.log(selectedObject);
		}
		if (newObject) {
			newObject.position.set(selectedObject.position.x,selectedObject.position.y,selectedObject.position.z);
			newObject.scale.set(selectedObject.scale.x,selectedObject.scale.y,selectedObject.scale.z);
			newObject.rotation.set(selectedObject.rotation.x,selectedObject.rotation.y,selectedObject.rotation.z);
		}
		
	}
}

document.querySelector("#addWall").onclick = function(){
	let cbox = floorStage.constraintBox;
	let len = cbox.max.x - cbox.min.x;
	let hei = cbox.max.y - cbox.min.y;
	
	let box = floorStage.meshFactory.createRestrainedMesh(
		new THREE.BoxGeometry(len,hei,0.1),
		new THREE.MeshStandardMaterial({side: THREE.DoubleSide}),
		true, true, floorStage.constraintBox
	);
	box.castShadow = true;
	box.position.y -= box.geometry.boundingBox.min.y;
}

document.querySelector("#delobj").onclick = function() {
	if(selectedObject) {
		currentStage.scene.remove(selectedObject);
	}
	let m = [];
	for(let obj of currentStage.movableObjects) {
		if(obj !== selectedObject) m.push(obj);
	}
	currentStage.movableObjects = m;
}
document.querySelector("#clear").onclick = function() {
	for(let obj of currentStage.movableObjects){
		currentStage.scene.remove(obj);
	}
	currentStage.movableObjects = [];
}

const materialSelector = document.querySelector("#materials");
materialSelector.onchange = function(e) {
	console.log(materialSelector.value);
	if (selectedObject && selectedObject.isMesh)
		materialManager.setMeshTexture(selectedObject, materialSelector.value);
	else if (selectedObject){
		applyToChildMeshes(selectedObject, (o)=>{materialManager.setMeshTexture(o, materialSelector.value);});
	}
}

function saveArrayBuffer(buffer, filename){
	save(new Blob([buffer], {type:'application/octet-stream'}), filename);
}
function save(blob, filename) {
	link.href = URL.createObjectURL(blob);
	
	assetLoader.load(link.href, function(gltf){
		const model = gltf.scene;
		console.log(model);
		for(let child of model.children){
			child.castShadow = true;
		}
		floorStage.scene.add(model);
		floorStage.movableObjects.push(model);
		model.position.set(0,0,0);
		
	}, undefined, function(error){
		console.log(error);
	}); 
	
	link.download = filename;
	// link.click();
}
const link = document.createElement('a');
document.body.appendChild(link);







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
const mat = materialManager.materials.light_brick();
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


