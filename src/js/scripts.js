import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

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




// const material = new THREE.LineBasicMaterial( { color: "red" } );
// const points = [];
// points.push( new THREE.Vector3( -1, 0, 0 ) );
// points.push( new THREE.Vector3( 1, 0, 0 ) );

// const geometry = new THREE.BufferGeometry().setFromPoints( points );

// const line = new THREE.Line( geometry, material );

// controller.currentStage.scene.add(line);




const box = controller.currentStage.meshFactory.createMesh(
	new THREE.BoxGeometry(0.5,0.5,0.5),
	new THREE.MeshStandardMaterial({wireframe:true}),
	controller.currentStage.constraintBox
);
// box.position.y -= box.geometry.boundingBox.min.y;
controller.currentStage.setScale(box,1,1,2);
// controller.currentStage.setScale(box,0.6,0.6,0.6);
console.log(box);


// const box2 = controller.currentStage.meshFactory.createRestrainedMesh(
	// new THREE.BoxGeometry(0.5,0.5,0.5),
	// new THREE.MeshStandardMaterial(),
	// controller.currentStage.constraintBox
// );

// box2.position.set(0.0,0.25,-2.0);
// box2.rotation.set(Math.PI/3, Math.PI, 0);

// let grp = new THREE.Group();
// grp.add(box);

// let box3 = new THREE.Box3().setFromObject(grp);
// let size = new THREE.Vector3();
// let size_copy = new THREE.Vector3();
// box3.getSize(size);
// size_copy.copy(size);

// size.x /= box.scale.x;
// size.y /= box.scale.y;
// size.z /= box.scale.z;

// let size_halved = new THREE.Vector3(
	// size.x/2, size.y/2, size.z/2
// );


// let pointsX = controller.currentStage.meshFactory.labelManager.getPointsForXLine(size_halved);
// let pointsZ = controller.currentStage.meshFactory.labelManager.getPointsForZLine(size_halved);
// let lineX = controller.currentStage.meshFactory.labelManager.createLineFromPoints(pointsX);
// let lineZ = controller.currentStage.meshFactory.labelManager.createLineFromPoints(pointsZ);


// let textX = controller.currentStage.meshFactory.labelManager.createText(
	// Math.floor(size_copy.x*1000)+'мм',
	// new THREE.Vector3(0,size_halved.y,-size_halved.z-0.1),
	// new THREE.Vector3(Math.PI/2, Math.PI, 0)
// );








// grp.add(lineX);
// grp.add(lineZ);
// grp.add(textX)

// controller.currentStage.addObject(grp,true,true);






// box.scale.set(1.4,1.4,1.4);
// controller.currentStage.meshFactory.addDimensionLines(box);


// let con = new THREE.Box3().setFromObject(box);
// let con_help = new THREE.Box3Helper(con, "blue");

// controller.currentStage.scene.add(con_help);
// let ora = box.geometry.boundingBox;
// let ora_help = new THREE.Box3Helper(ora, "orange");
// controller.currentStage.scene.add(ora_help);



// const loader = new FontLoader();
// let textMesh;
// loader.load( 'assets/fonts/Arial_Regular.json', 
	// function (font) {
		// const geometry = new TextGeometry( 'Hello three.js!', {
			// font: font,
			// size: 0.1,
			// depth: 0.01
		// } );
		
		// textMesh = new THREE.Mesh(geometry, [
			// new THREE.MeshPhongMaterial({color: "white"}),
			// new THREE.MeshPhongMaterial({color: "white"}),
		// ]);
		
		// box.add(textMesh);
		// textMesh.position.set(0,0,0);
		
	// }
// );

	// let myText = new Text()
		
		// myText.text = "test yoba"
		// myText.position.set(
			// 0, 0, 0
		// );
		
		// myText.fontSize = 10
		// myText.color = 'white'
		// myText.userData.isText = true;
		// myText.textAlign = 'center';
		// myText.anchorX = '50%';

// let grp = new THREE.Group();
// grp.add(myText);
// box.add(grp);
// grp.scale.set(1,0.1,1);