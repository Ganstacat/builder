import * as THREE from 'three';
import {OBB} from 'three/examples/jsm/math/OBB.js';

export function applyToArrayOrValue(maybeArray, cb, args) {
	if (Array.isArray(maybeArray))
		for (let m of maybeArray)
			cb(m,args);
	else
		cb(maybeArray,args);
}

/**
	Применить функцию cb с аргументами args ко всем потомкам-моделям объекта obj.
*/
export function	applyToMeshes(obj, cb, args) {
	if(obj.isMesh && !obj.userData.isText && !obj.userData.isLine) {
		cb(obj, args);
	}
	else if(obj.children.length > 0) {
		for(let o of obj.children)
			this.applyToMeshes(o,cb,args);
	}
}

export function snapPoint(p) {
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

export function angleBetweenSegmentsXZ(A, O, B) {
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

export function arePointsNearXZ(p1,p2) {
	const NEAR_DIST = 0.4;
	
	const y1 = p1.y;
	const y2 = p2.y;
	p1.y = 0; p2.y = 0;
	
	const dist = p1.distanceTo(p2);
	const areNear = (dist < NEAR_DIST);
	p1.y = y1; p2.y = y2;
	return areNear;
}
export function pointsHaveSameCoordinatesXZ(p1,p2){
	return (p1.x === p2.x && p1.z === p2.z);
}

/**
	Создать модель, используя данные о её геометрии и материале. Созданные модели имеют структуру
	group(container) -> group(model) -> mesh
*/
export function createMesh(geometry, material) {
	const size = new THREE.Vector3( geometry.parameters.width, geometry.parameters.height, geometry.parameters.depth );
	
	geometry.userData.obb = new OBB();
	geometry.userData.obb.halfSize.copy(size).multiplyScalar(0.5);

	
	let mesh = new THREE.Mesh(geometry, material);
	mesh.geometry.computeBoundingBox();
	mesh.matrixAutoUpdate = false;
	mesh.userData.obb = new OBB();
	
	
	let modelGroup = new THREE.Group();
	let containerGroup = new THREE.Group();
	modelGroup.name = 'models';
	modelGroup.add(mesh);
	containerGroup.name = 'container';
	containerGroup.add(modelGroup);
	
	return containerGroup;
}
export function getObjectSize(obj){
	const clone = obj.clone();
	clone.rotation.set(0,0,0);
	let size = new THREE.Vector3();
	const box3 = new THREE.Box3().setFromObject(clone);
	box3.getSize(size);
	return size;
	
}

/**
	Создать дубликат какого-то объекта - либо модели, либо группы моделей. Материалы у объектов клонируются.
*/
export function cloneObject(obj) {
	let newobj = obj.clone();
	this.applyToMeshes(newobj, (o)=>{
		const size = new THREE.Vector3( o.geometry.parameters.width, o.geometry.parameters.height, o.geometry.parameters.depth );
		o.geometry.userData.obb = new OBB();
		o.geometry.userData.obb.halfSize.copy(size).multiplyScalar(0.5);
		o.userData.obb = new OBB();
		
		if (Array.isArray(o.material))
			o.material = Array.from(o.material, x => x);
		else
			o.material = o.material.clone();
	});
	
	return newobj;
}



/**
	Получает координаты всех 8 точек, определяющих box3 в пространстве
*/
export function getBox3Points(box3){
	let points = [];
	points.push(new THREE.Vector3(box3.max.x, box3.max.y, box3.max.z));
	points.push(new THREE.Vector3(box3.min.x, box3.max.y, box3.max.z));
	points.push(new THREE.Vector3(box3.min.x, box3.max.y, box3.min.z));
	points.push(new THREE.Vector3(box3.max.x, box3.max.y, box3.min.z));
	points.push(new THREE.Vector3(box3.max.x, box3.min.y, box3.max.z));
	points.push(new THREE.Vector3(box3.min.x, box3.min.y, box3.max.z));
	points.push(new THREE.Vector3(box3.min.x, box3.min.y, box3.min.z));
	points.push(new THREE.Vector3(box3.max.x, box3.min.y, box3.min.z));
	return points;
}


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