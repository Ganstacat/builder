import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as dat from 'dat.gui'; // 

// import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
// import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';

import {Text} from 'troika-three-text';


import {Stage} from './Stage.js';
import {FloorPlannerStage} from './FloorPlannerStage.js';
import {DragEnginePlane} from './DragEnginePlane.js';
import {MaterialManager} from './MaterialManager.js';
import {MainController} from './MainController.js';
import {ExportManager} from './ExportManager.js';
import {LabelManager} from './LabelManager.js';
import {addListeners} from './addListeners.js';
import {addKeyboardControls} from './addKeyboardControls.js';

/**
	Точка входа в приложение, создаются объекты, разрешаются зависимости
*/


const textureLoader = new THREE.TextureLoader();
const materialManager = new MaterialManager(textureLoader);

const assetLoader = new GLTFLoader();
const exporter = new GLTFExporter();
const exportManager = new ExportManager(exporter, assetLoader);

const dragEngine = new DragEnginePlane();
const controller = new MainController(dragEngine, exportManager, materialManager);

const builderStage = new Stage();
const floorStage = new FloorPlannerStage();

controller.registerStage("builder", builderStage);
controller.registerStage("floorPlanner", floorStage);
controller.setCurrentStage("builder");


addListeners(controller);
addKeyboardControls(controller);



const material = new THREE.LineBasicMaterial( { color: "red" } );
// const material2 = new THREE.LineBasicMaterial( { color: 'red' } );
// const v2o = new THREE.Vector3(0,0,0);
// const v2d = new THREE.Vector3(0,0,4);
// const v2c = new THREE.Vector3(4,0,0);
// console.log(v2o.angleTo(v2d));

// const points = [];
// points.push(v2o);
// points.push(v2d);
// const geometry = new THREE.BufferGeometry().setFromPoints(points);
// const geometry2 = new THREE.BufferGeometry().setFromPoints([v2o,v2c]);
// const line = new THREE.Line( geometry, material );
// const line2 = new THREE.Line( geometry2, material2 );
// controller.currentStage.scene.add( line );
// controller.currentStage.scene.add( line2 );


let inter = new THREE.Vector3();
let point1;

document.addEventListener("click", ()=>{
	dragEngine.stage.raycaster.ray.intersectPlane(dragEngine.planeDrag, inter);
	const point = new THREE.Vector3(
			inter.x,
			1,
			inter.z,
	);
	
	if(!point1) {
		point1 = point; 
	} else {
		// point1.round();
		// point.round();
		const geometry = new THREE.BufferGeometry().setFromPoints([point1, point]);
		const line = new THREE.Line(geometry, material);
		controller.currentStage.scene.add(line);
		console.log(point1);
		console.log(point);
		
		const dist = point1.distanceTo(point);
		const boxgeo = new THREE.BoxGeometry(0.2,2,dist);
		const boxmat = new THREE.LineBasicMaterial( { color: Math.random()*0xFFFFFF } );
		const mesh = new THREE.Mesh( boxgeo, boxmat );
		controller.currentStage.scene.add(mesh);
		mesh.position.set(
			(point.x + point1.x)/2,
			1,
			(point.z + point1.z)/2
		);
		mesh.lookAt(point);
		
		
		point1 = point;
	}
})

let line;
document.addEventListener('pointermove', function(e) {
	if (point1){
		
		if(line) {
			controller.currentStage.scene.remove(line);
		}
		dragEngine.stage.raycaster.ray.intersectPlane(dragEngine.planeDrag, inter);
		const point = new THREE.Vector3(
				inter.x,
				1,
				inter.z,
		);
		const geometry = new THREE.BufferGeometry().setFromPoints([point1, point]);
		line = new THREE.Line(geometry, material);
		controller.currentStage.scene.add(line);
	}
	
});