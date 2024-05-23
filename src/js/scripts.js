import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as dat from 'dat.gui'; // 
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as utils from './utils.js';

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

class WallGraph {
	constructor(){
		this.walls = new Set();
	}
	add(wall){
		if (!this.has(wall)) {
			this.walls.add(wall);
			return true;
		}
		return false;
	}
	deleteRaw(wall) {
		return this.walls.delete(wall);
	}
	delete(wall) {
		for (let w of this.walls)
			if (this.wallsAreSame(w,wall))
				return this.walls.delete(w)
		return false;
	}
	has(wall){
		for (let w of this.walls)
			if (this.wallsAreSame(w,wall)) return true
		return false
	}
	wallsAreSame(w1,w2){
		return (this.pointsAreSame(w1.userData.startPoint, w2.userData.startPoint) && this.pointsAreSame(w1.userData.endPoint, w2.userData.endPoint));
	}
	pointsAreSame(p1,p2){
		return (p1.x === p2.x && p1.z === p2.z);
	}
	wallHasPoint(wall,point) {
		return (this.pointsAreSame(wall.userData.startPoint, point) || this.pointsAreSame(wall.userData.endPoint, point));
	}
	getWallsByPoint(p){
		const walls = [];
		for (let w of this.walls) {
			if (this.wallHasPoint(w,p)) walls.push(w);
		}
		return walls;
	}
}

let inter = new THREE.Vector3();
let start;
let end;

let nodes = [];
let nodesList = [];
let polys = [];
let walls = [];
let anchors = [];
const wallGraph = new WallGraph();


let angleStart;
let angle;

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


function removeFloor(){
	for (let p of polys) {
		p.removeFromParent();
	}
	polys=[];
	height = 0.001;
}

function changeFloor(oldP, newP){
	for(let i = 0; i < nodesList.length; i++)
		for (let j = 0; j < nodesList[i].length; j++) {
			if (pointsEqual(nodesList[i][j],oldP)) {
				nodesList[i][j] = newP;
			}
		}
}
function redrawFloor(){
	removeFloor();
	for(let nodes of nodesList) {
		const poly = createPolygon(nodes);
		controller.currentStage.scene.add(poly);
		polys.push(poly);
	}
}

function movePoint(p, newPos) {
	const p_copy = p.clone();
	p.addVectors(p, newPos);
	const connectedWalls = wallGraph.getWallsByPoint(p_copy);
	const startPoints = [];
	const endPoints = [];
	for(let w of connectedWalls) {
		endPoints.push(p);
		if(pointsEqual(w.userData.startPoint, p_copy)) {
			startPoints.push(w.userData.endPoint);
		} else {
			startPoints.push(w.userData.startPoint);
		}
		controller.currentStage.removeObject(w);
		wallGraph.deleteRaw(w);
	}
	
	for (let i = 0; i < startPoints.length; i++) {
		const wall = makeWallBetweenTwoPoints(startPoints[i], endPoints[i], box2MultiMaterial);
		
		const added = wallGraph.add(wall);
		if(added)
			controller.currentStage.addObject(wall,true,false,false);
		else console.log('already present');
	}
	
	changeFloor(p_copy, p);
	redrawFloor();
}
let findindex = -1;
function movePolyPoint(poly, oldP, newP) {
	// console.log(poly);
	
	let position = poly.geometry.attributes.position.array;
	if(findindex !== -1) {
		// console.log(`posx: ${position[findindex]}, posz: ${position[findindex+1]}`);
		// console.log(`oldX: ${oldP.x}, oldZ: ${oldP.z}, newX: ${newP.x}, newZ: ${newP.z}`);
	}
	
	for(let i = 0; i < position.length; i+=3) {
		//012 - xzy
		if( position[i] - oldP.x < 0.01 && 
			position[i+1] - oldP.z < 0.01
		) {
			// console.log(`I: oldX: ${oldP.x}, oldZ: ${oldP.z}, newX: ${newP.x}, newZ: ${newP.z}`);
			if(findindex === -1) findindex = i;
			
			// position[i] = newP.x;
			// position[i+1] = newP.z;
			// position[i] = 1;
			// position[i+1] = 1;
		}
		
	}
	poly.geometry.attributes.position.array = position;
	poly.geometry.attributes.position.needsUpdate = true;
}

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



function snapPoint(p) {
	function roundToNearestQuarter(num) {
		const integerPart = Math.floor(num);
		const fractionalPart = num - integerPart;

		let roundedFraction;

		if (fractionalPart < 0.125) {
			roundedFraction = 0.0;
		} else if (fractionalPart < 0.375) {
			roundedFraction = 0.25;
		} else if (fractionalPart < 0.625) {
			roundedFraction = 0.5;
		} else if (fractionalPart < 0.875) {
			roundedFraction = 0.75;
		} else {
			roundedFraction = 1.0;
		}

		return integerPart + roundedFraction;
	}
	
	p.x = roundToNearestQuarter(p.x);
	p.z = roundToNearestQuarter(p.z);
}

function angleBetweenSegments(A, O, B) {
  // Координаты точек
  const [x1, y1] = [A.x, A.z];
  const [x0, y0] = [O.x, O.z];
  const [x2, y2] = [B.x, B.z];
  
  // Вектор OA
  const vectorOA = [x1 - x0, y1 - y0];
  const vectorOB = [x2 - x0, y2 - y0];
  
  // Скалярное произведение векторов
  const dotProduct = vectorOA[0] * vectorOB[0] + vectorOA[1] * vectorOB[1];
  
  // Длины векторов
  const magnitudeOA = Math.sqrt(vectorOA[0] * vectorOA[0] + vectorOA[1] * vectorOA[1]);
  const magnitudeOB = Math.sqrt(vectorOB[0] * vectorOB[0] + vectorOB[1] * vectorOB[1]);
  
  // Вычисляем косинус угла
  const cosTheta = dotProduct / (magnitudeOA * magnitudeOB);
  
  // Вычисляем угол в радианах
  const theta = Math.acos(cosTheta);
  
  // Преобразуем радианы в градусы
  const degrees = theta * (180 / Math.PI);
  
  return degrees;
}


function makeWallBetweenTwoPoints(start, end, material) {
	const dist = start.distanceTo(end);
	const boxgeo = new THREE.BoxGeometry(0.2,2,dist);
	// const mesh = new THREE.Mesh(boxgeo, material);
	
	const mat = [];
	utils.applyToArrayOrValue(material, (m)=>{
		mat.push(m.clone());
	});
	const mesh = controller.currentStage.meshFactory.createMesh(boxgeo, mat);
	
	mesh.position.set(
		(start.x + end.x)/2,
		1,
		(start.z + end.z)/2
	);
	
	mesh.userData.startPoint = start;
	mesh.userData.endPoint = end
	mesh.userData.onMove = (sp, ep)=>{
		// посчитать, как сдвинулась стена, то есть вектор
		// от sp до ep
		const moved = new THREE.Vector3().subVectors(ep,sp);
		
		// передвинуть startPoint и endPoint в этом же направлении, получив sp2 и ep2
		const sp2 = new THREE.Vector3().addVectors(mesh.userData.startPoint, moved);
		const ep2 = new THREE.Vector3().addVectors(mesh.userData.endPoint, moved);
		
		// вызвать movePoint(startPoint, sp2), movePoint(endPoint.ep2)
		movePoint(mesh.userData.startPoint, moved);
		movePoint(mesh.userData.endPoint, moved);
		
		// обновить startPoint = sp2 и endPoint = ep2
		mesh.userData.startPoint = sp2;
		mesh.userData.endPoint = ep2;
	}
	mesh.lookAt(end);
	return mesh;
}

function makeCylinderAtPoint(point) {
		const mesh = new THREE.Mesh(
			new THREE.CylinderGeometry(0.1,0.1,2), 
			new THREE.MeshStandardMaterial({
				color: 'gray'
			})
		);
		
		mesh.position.set(point.x, 1, point.z);
		return mesh;
}

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



function pointsEqual(p1,p2) {
	return (p1.x === p2.x && p1.z === p2.z);
}


function arePointsNear(p1,p2) {
	const NEAR_DIST = 0.4;
	
	const y1 = p1.y;
	const y2 = p2.y;
	p1.y = 0; p2.y = 0;
	
	const dist = p1.distanceTo(p2);
	const areNear = (dist < NEAR_DIST);
	p1.y = y1; p2.y = y2;
	return areNear;
}




let height = 0.0001;
function createPolygon(points) {
	if (points.length < 3) return;
	const shape = new THREE.Shape();
	shape.moveTo(points[0].x, points[0].z);
	for (let i = 1; i < points.length; i++) {
		shape.lineTo(points[i].x, points[i].z);
	}
	const geometry = new THREE.ShapeGeometry(shape);
	const material = new THREE.MeshBasicMaterial({
		// color: Math.random()*0xFFFFFF,
		color: "Beige", 
		side: THREE.DoubleSide});
	// const mesh = new THREE.Mesh(geometry, material);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = 0.5*Math.PI;
	
	mesh.position.y += height;
	height+= 0.0001;
	return mesh;
}

// TODO: с помощью line.at метода при построении делить стенку на сегменты, к которым можно примагнититься
// TODO: сделать wallgraph 







// const sp = new THREE.Vector3(-2,0,-2);
// const ep = new THREE.Vector3(2,0,2);
// const zp = new THREE.Vector3(1,0,1);
// console.log(sp.subVectors(ep, sp));
// console.log(zp.addVectors(zp,sp));












/*

function makeParallelLine(point,point1,offset) {
	let x1 = point1.x;
	let x2 = point.x;
	let z1 = point1.z;
	let z2 = point.z;
	
	const y1 = point.y;
	const y2 = point1.y;
	point.y = 0; point1.y = 0;
	const dist = point.distanceTo(point1);
	point.y = y1; point1.y = y2;
	
	const x1p = x1 + offset * (z2-z1) / dist;
	const x2p = x2 + offset * (z2-z1) / dist;
	const z1p = z1 + offset * (x1-x2) / dist;
	const z2p = z2 + offset * (x1-x2) / dist;
	
	const geometry2 = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(x1p,1,z1p),
		new THREE.Vector3(x2p,1,z2p)]);
	
	return new THREE.Line(geometry2, material);
}


*/