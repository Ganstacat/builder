import * as THREE from 'three';
import {OBB} from 'three/examples/jsm/math/OBB.js';
import {addListenersToPackableObject} from './packableObjectListeners.js';

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
export function pointsEquals(p1,p2){
	return (p1.x === p2.x && p1.y === p2.y && p1.z === p2.z);
}




/**
 * rounding float  to 4 decimals
 */
export function round(f){
	return Math.round((f + Number.EPSILON) * 100) / 100
}
// export function extendSliceToBoxSide(box, sliceRemoved, sliceExtended ){
// 	const rmin = this.round(sliceRemoved.min.x) ;
// 	const rmax = this.round(sliceRemoved.max.x);
// 	const smin = this.round(sliceExtended.min.x);
// 	const smax = this.round(sliceExtended.max.x);
	
// 	if(rmin !== smin && rmax !== smax) {
// 		// по вертикали увеличение
// 		console.log('extending vertically');
// 		sliceExtended.min.y = box.min.y;
// 		sliceExtended.max.y = box.max.y;
		
// 	} else {
// 		// по горизонтали (ось x)
// 		console.log('extending horizontally');
// 		sliceExtended.min.x = box.min.x;
// 		sliceExtended.max.x = box.max.x;
// 	}
// }
// export function sliceRestsAgainstBox(box,slice){
// 	if(box.min.x === slice.min.x && box.max.x === slice.max.x) return true;
// 	if(box.min.y === slice.min.y && box.max.y === slice.max.y) return true;
// 	return false;
// }



export function getBox3Size(box3){
	const length = (box3.max.x - box3.min.x);
	const height = (box3.max.y - box3.min.y);
	const width  = (box3.max.z - box3.min.z);
	return new THREE.Vector3(length,height, width);
}
export function getModelsGroup(obj){
	if (obj.name.startsWith('models')) return obj;
	else
		for (let c of obj.children)
			return this.getModelsGroup(c);
}

// export function divideBox3ByObject(box,obj){
// 	const slice = this.getObjSlice(obj);
// 	return this.divideBox3BySlice(box,slice);
// }
// export function uniteBoxes3(box1, box2){
// 	let min;
// 	let max;
// 	if(box1.min.x < box2.min.x || box1.min.y < box2.min.y || box1.min.z < box2.min.z) {
// 		min = box1.min;
// 		max = box2.max;
// 	} else {
// 		min = box2.min;
// 		max = box1.max;
// 	}
// 	return new THREE.Box3(min, max);
// }
export function box3sAreSame(box1,box2){
	const min1 = box1.min;
	const max1 = box1.max;
	const min2 = box2.min;
	const max2 = box2.max;

	return (
		(min1.x === min2.x && min1.y === min2.y && min1.z === min2.z) &&
		(max1.x === max2.x && max1.y === max2.y && max1.z === max2.z)
	)
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
// export function getObjectSize(obj){
// 	const clone = obj.clone();
// 	clone.rotation.set(0,0,0);
// 	let size = new THREE.Vector3();
// 	const box3 = new THREE.Box3().setFromObject(clone);
// 	box3.getSize(size);
// 	return size;
	
// }
export function moveBox3(box3, moved){
	box3.min.addVectors(box3.min, moved);
	box3.max.addVectors(box3.max, moved);
}
export function moveObj(obj, moved){
	obj.position.addVectors(obj.position, moved);
}
export function doWithoutLabels(obj, cb, args){
	let temp = [...obj.children];
	for (let c of temp)
		if (c.userData.isText || c.isLine)
			obj.remove(c)
		
	cb(obj, args);
	
	for (let c of temp)
		obj.add(c)
	
}

/**
	Создать дубликат какого-то объекта - либо модели, либо группы моделей. Материалы у объектов клонируются.
*/
export function cloneObject(obj) {
	let newobj = obj.clone();
	
	this.applyToMeshes(newobj, (o)=>{
		const oldObb = o.geometry.userData.obb;
		o.geometry.userData.obb = new OBB(oldObb.center, oldObb.halfSize, oldObb.rotation);
		o.userData.obb = new OBB();
		
		if (Array.isArray(o.material))
			o.material = Array.from(o.material, x => x);
		else
			o.material = o.material.clone();
	});

	return newobj;
}

export function generateRamdomId(){
	let length = 20;
	const symbols = [
		'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
		'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
		'0','1','2','3','4','5','6','7','8','9'
	]
	let result = ''; 
	for(let i = 0; i < length; i++){
		const index = Math.floor(Math.random()*symbols.length);
		result += symbols[index];
	}
	return result;

}

/**
	Получает координаты всех 8 точек, определяющих box3 в пространстве
*/
export function getBox3Points(box3){
	const points = [];
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

export function getOBBPoints(obb){
	const rotated = [];
	const result = [];
	const r = obb.rotation;
	const c = obb.center;
	const s = obb.halfSize;
	
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 - s.x, 0 + s.y, 0 - s.z
	),r));
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 - s.x, 0 + s.y, 0 + s.z
	),r));
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 - s.x, 0 - s.y, 0 - s.z
	),r));
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 - s.x, 0 - s.y, 0 + s.z
	),r));
	
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 + s.x, 0 + s.y, 0 - s.z
	),r));
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 + s.x, 0 + s.y, 0 + s.z
	),r));
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 + s.x, 0 - s.y, 0 - s.z
	),r));
	rotated.push(this.rotatePoint(new THREE.Vector3(
		0 + s.x, 0 - s.y, 0 + s.z
	),r));
	
	for (let p of rotated){
		result.push(new THREE.Vector3(
			c.x + p.x, c.y + p.y, c.z + p.z
		));
	}
	return result;
	
}
export function rotatePoint(p, r){
	// return p;
	//r - rotation matrix
	const rm = r.toArray();
	return new THREE.Vector3(
		(p.x*rm[0])+(p.y*rm[3])+(p.z*rm[6]),
		(p.x*rm[1])+(p.y*rm[4])+(p.z*rm[7]),
		(p.x*rm[2])+(p.y*rm[5])+(p.z*rm[8])
	);
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