import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as dat from 'dat.gui';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';


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
import * as utils from './utils.js';

/**
	Точка входа в приложение, создаются объекты, разрешаются зависимости
*/


const textureLoader = new THREE.TextureLoader();
const materialManager = new MaterialManager(textureLoader);

const assetLoader = new GLTFLoader();
const exporter = new GLTFExporter();
const exportManager = new ExportManager(exporter, assetLoader);

const dragEngine = new DragEnginePlane();
const labelManager = new LabelManager();
const controller = new MainController(dragEngine, exportManager, materialManager, labelManager);

const builderStage = new Stage(controller);
const floorStage = new FloorPlannerStage(controller);

controller.registerStage("builder", builderStage);
controller.registerStage("floorPlanner", floorStage);
controller.setCurrentStage("builder");


addListeners(controller);
addKeyboardControls(controller);

// TODO переделать MaterialManager дял работы с applyTOMESHES и мультиматериалов
// TODO разгрести говно в addListeners: материал селекторе и upload

/*

const materialBad = new THREE.LineBasicMaterial( { color: "red", linewidth: 5 } );
const materialGood = new THREE.LineBasicMaterial( { color: "green", linewidth: 5 } );

const walltexture = textureLoader.load('./assets/textures/wallpaper2.jpg');
walltexture.wrapS = THREE.RepeatWrapping;
walltexture.wrapT = THREE.RepeatWrapping;
walltexture.repeat.set(4,4);
const wallMaterial = new THREE.MeshStandardMaterial({map: walltexture});

const box2MultiMaterial = [
	wallMaterial,
	wallMaterial,
	new THREE.MeshStandardMaterial({
	color: 'gray',
	side: THREE.DoubleSide,
	}),
	new THREE.MeshStandardMaterial({
	color: 'yellow',
	side: THREE.DoubleSide,
	}),
	new THREE.MeshStandardMaterial({
	color: 'white',
	side: THREE.DoubleSide,
	}),
	new THREE.MeshStandardMaterial({
	color: 'white',
	side: THREE.DoubleSide,
	}),
];



// let inter = new THREE.Vector3();
// let start;
// let end;

// let nodes = [];
// let nodesList = [];
// let polys = [];
// let walls = [];
// let anchors = [];
// const wallGraph = new WallGraph();


// let angleStart;
// let angle;

let drawing = false;

document.addEventListener("click", ()=>{
	if (!drawing) return;
	
	if(!start) {
		
		for (let p of anchors){
			if(arePointsNear(end, p)){
				end.x = p.x;
				end.z = p.z;
			}		
		}
		
		start = end;
		anchors.push(end);
		
		
	} else {
		angleStart = start;
		
		const wall = makeWallBetweenTwoPoints(start, end, box2MultiMaterial);
		
		const added = wallGraph.add(wall);
		if(added)
			controller.currentStage.addObject(wall,true,false,false);
		else console.log('already present');
		walls.push(wall);
		
		// const cylinder = makeCylinderAtPoint(end)
		// controller.currentStage.scene.add(cylinder);
		

		nodes.push(start);

		let closed = false;
		
		if (pointsEqual(nodes[0], end)) closed = true;

		
		if (closed) {
			// nodes.push(end);
			const poly = createPolygon(nodes);
			controller.currentStage.scene.add(poly);
			polys.push(poly);
			nodesList.push(nodes);

			
			for (let w of walls)
				anchors.push(w.userData.startPoint)
			
			start = null;
			walls = [];
			nodes = [];
		} else {			
			start = end;
		}
	}
	

})





// function redrawFloor(){
	// removeFloor();
	// for(let nodes of nodesList) {
		// const poly = createPolygon(nodes);
		// controller.currentStage.scene.add(poly);
		// polys.push(poly);
	// }
// }

// function movePoint(p, newPos) {
	// const p_copy = p.clone();
	// p.addVectors(p, newPos);
	// const connectedWalls = wallGraph.getWallsByPoint(p_copy);
	// const startPoints = [];
	// const endPoints = [];
	// for(let w of connectedWalls) {
		// endPoints.push(p);
		// if(pointsEqual(w.userData.startPoint, p_copy)) {
			// startPoints.push(w.userData.endPoint);
		// } else {
			// startPoints.push(w.userData.startPoint);
		// }
		// controller.currentStage.removeObject(w);
		// wallGraph.deleteRaw(w);
	// }
	
	// for (let i = 0; i < startPoints.length; i++) {
		// const wall = makeWallBetweenTwoPoints(startPoints[i], endPoints[i], box2MultiMaterial);
		
		// const added = wallGraph.add(wall);
		// if(added)
			// controller.currentStage.addObject(wall,true,false,false);
		// else console.log('already present');
	// }
	
	// changeFloor(p_copy, p);
	// redrawFloor();
// }

document.body.addEventListener("mousedown", event => {
	if (event.button == 2){   // right click for mouse
		// movePoint(
			// new THREE.Vector3(0,0,0),
			// new THREE.Vector3(1,1,1)
		// );
		drawing = !drawing;
	}
});


let line;
document.addEventListener('pointermove', function(e) {
	if (!drawing) return;
	dragEngine.stage.raycaster.ray.intersectPlane(
		dragEngine.planeDrag,
		inter
	);

	end = new THREE.Vector3(inter.x,1,inter.z,);
	snapPoint(end);

	if (start){
		
		if(line) controller.currentStage.scene.remove(line);
		
		for (let p of anchors){
			if(arePointsNear(end, p)){
				end.x = p.x;
				end.z = p.z;
			}		
		}

		let material = materialGood
		if (angleStart){
			angle = angleBetweenSegments(angleStart, start, end);
			if (angle < 45) material = materialBad;
		}

		const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
		line = new THREE.Line(geometry, material);
		controller.currentStage.scene.add(line);
		
	}
});



// function snapPoint(p) {
	// function roundToNearestQuarter(num) {
		// const integerPart = Math.floor(num);
		// const fractionalPart = num - integerPart;

		// let roundedFraction;

		// if (fractionalPart < 0.125) {
			// roundedFraction = 0.0;
		// } else if (fractionalPart < 0.375) {
			// roundedFraction = 0.25;
		// } else if (fractionalPart < 0.625) {
			// roundedFraction = 0.5;
		// } else if (fractionalPart < 0.875) {
			// roundedFraction = 0.75;
		// } else {
			// roundedFraction = 1.0;
		// }

		// return integerPart + roundedFraction;
	// }
	
	// p.x = roundToNearestQuarter(p.x);
	// p.z = roundToNearestQuarter(p.z);
// }

// function angleBetweenSegments(A, O, B) {
  // // Координаты точек
  // const [x1, y1] = [A.x, A.z];
  // const [x0, y0] = [O.x, O.z];
  // const [x2, y2] = [B.x, B.z];
  
  // // Вектор OA
  // const vectorOA = [x1 - x0, y1 - y0];
  // const vectorOB = [x2 - x0, y2 - y0];
  
  // // Скалярное произведение векторов
  // const dotProduct = vectorOA[0] * vectorOB[0] + vectorOA[1] * vectorOB[1];
  
  // // Длины векторов
  // const magnitudeOA = Math.sqrt(vectorOA[0] * vectorOA[0] + vectorOA[1] * vectorOA[1]);
  // const magnitudeOB = Math.sqrt(vectorOB[0] * vectorOB[0] + vectorOB[1] * vectorOB[1]);
  
  // // Вычисляем косинус угла
  // const cosTheta = dotProduct / (magnitudeOA * magnitudeOB);
  
  // // Вычисляем угол в радианах
  // const theta = Math.acos(cosTheta);
  
  // // Преобразуем радианы в градусы
  // const degrees = theta * (180 / Math.PI);
  
  // return degrees;
// }



// function makeCylinderAtPoint(point) {
		// const mesh = new THREE.Mesh(
			// new THREE.CylinderGeometry(0.1,0.1,2), 
			// new THREE.MeshStandardMaterial({
				// color: 'gray'
			// })
		// );
		
		// mesh.position.set(point.x, 1, point.z);
		// return mesh;
// }

// function pointsEqual(p1,p2) {
	// return (p1.x === p2.x && p1.z === p2.z);
// }

let height = 0.0001;
// function createPolygon(points) {
	// if (points.length < 3) return;
	// const shape = new THREE.Shape();
	// shape.moveTo(points[0].x, points[0].z);
	// for (let i = 1; i < points.length; i++) {
		// shape.lineTo(points[i].x, points[i].z);
	// }
	// const geometry = new THREE.ShapeGeometry(shape);
	// const material = new THREE.MeshBasicMaterial({
		// // color: Math.random()*0xFFFFFF,
		// color: "Beige", 
		// side: THREE.DoubleSide});
	// // const mesh = new THREE.Mesh(geometry, material);
	// const mesh = new THREE.Mesh(geometry, material);
	// mesh.rotation.x = 0.5*Math.PI;
	
	// mesh.position.y += height;
	// height+= 0.0001;
	// return mesh;
// }

// TODO: с помощью line.at метода при построении делить стенку на сегменты, к которым можно примагнититься
// TODO: сделать wallgraph 


// function arePointsNear(p1,p2) {
	// const NEAR_DIST = 0.4;
	
	// const y1 = p1.y;
	// const y2 = p2.y;
	// p1.y = 0; p2.y = 0;
	
	// const dist = p1.distanceTo(p2);
	// const areNear = (dist < NEAR_DIST);
	// p1.y = y1; p2.y = y2;
	// return areNear;
// }


// проверяет, к какой комнате и стенен относится точка
function pointBelongsToWhichRoom(point, rooms){
	// rooms -> walls -> wall
	for (let i = 0; i < rooms.length; i++){
		for (let w of rooms[i]) {
			if (pointsEqual(w.userData.startPoint, point)) {
				return i;
			}
		}
	}
	return -1;
}




*/



