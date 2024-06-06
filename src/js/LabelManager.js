import * as THREE from 'three';
import {Text} from 'troika-three-text';
import * as utils from './utils.js';

/**
	Класс, который управляет размерными линиями.
*/
export class LabelManager {
	#offset = 0.01;	
	getObjDepth(obj){
		const geomDepth = obj.geometry.parameters.depth;
		return geomDepth * obj.scale.z;
	}
	/**
		Добавляет размерные линии к объектам
	*/
	addLabelToObject(obj){
		const rotationTemp = obj.rotation.clone();

		obj.rotation.set(0,0,0);
		if(obj.userData.isWall) this.addWallDimensions(obj);
		else this.addObjectDimensions(obj);

		obj.rotation.copy(rotationTemp);

	}

	addWallDimensions(obj) {
		let box3 = new THREE.Box3().setFromObject(obj);
		let size = new THREE.Vector3();
		let size_copy = new THREE.Vector3();
		box3.getSize(size);
		size_copy.copy(size);
		
		size.x /= obj.scale.x;
		size.y /= obj.scale.y;
		size.z /= obj.scale.z;
		
		let size_halved = new THREE.Vector3(
			size.x/2, size.y/2, size.z/2
		);
		
		let mesh;
		utils.applyToMeshes(obj, (o)=>{
			mesh = o;
		});
		const depth = this.getObjDepth(mesh);
		let textX = this.createText(
			Math.floor(depth*1000)+'мм',
			new THREE.Vector3(
				0,
				size_halved.y+0.1,
				0
			),
			new THREE.Vector3(Math.PI/2, Math.PI, Math.PI),
			0.2
		);
		obj.add(textX)

		textX.sync();

	}
	addObjectDimensions(obj) {
		console.log(obj);
		if(obj.userData.labelIsHidden) return;
		// obj.material.wireframe = true;
		let box3 = new THREE.Box3().setFromObject(obj);
		let size = new THREE.Vector3();
		let size_copy = new THREE.Vector3();
		box3.getSize(size);
		size_copy.copy(size);
		
		size.x /= obj.scale.x;
		size.y /= obj.scale.y;
		size.z /= obj.scale.z;
		
		let size_halved = new THREE.Vector3(
			size.x/2, size.y/2, size.z/2
		);
		
		
		let pointsX = this.getPointsForXLine(size_halved);
		let pointsZ = this.getPointsForZLine(size_halved);
		let pointsY = this.getPointsForYLine(size_halved);
		let lineX = this.createLineFromPoints(pointsX);
		let lineZ = this.createLineFromPoints(pointsZ);
		let lineY = this.createLineFromPoints(pointsY);
		

		const textSizes = [size.x/10, size.y/10, size.z/10];
		for(let i = 0; i < textSizes.length; i++){
			if (textSizes[i] < 0.01) textSizes[i] = 0.01
			else if (textSizes[i] > 0.1) textSizes[i] = 0.1
		}

		let textX = this.createText(
			Math.floor(size_copy.x*1000)+'мм',
			new THREE.Vector3(
				0,
				// size_halved.y,
				size_halved.y+0.001,
				size_halved.z+this.#offset),
			new THREE.Vector3(Math.PI/2, Math.PI,Math.PI),
			textSizes[0]
		);
		let textZ = this.createText(
			Math.floor(size_copy.z*1000)+'мм',
			new THREE.Vector3(
				size_halved.x+this.#offset,
				// size_halved.y,
				size_halved.y+0.0001,
				0),
			new THREE.Vector3(Math.PI/2, Math.PI, Math.PI*1.5),
			textSizes[2]
		);
		let textY = this.createText(
			Math.floor(size_copy.y*1000)+'мм',
			new THREE.Vector3(
				size_halved.x+this.#offset,
				0,
				size_halved.z+this.#offset),
			new THREE.Vector3(0,0,Math.PI/2),
			textSizes[1]
		);
		
		obj.add(lineX);
		obj.add(lineZ);
		obj.add(lineY);
		obj.add(textX)
		obj.add(textZ)
		obj.add(textY)
		
		// let bx = new THREE.Box3().setFromObject(myText);
		// let s2 = new THREE.Vector3();
		// console.log(bx);
		// bx.getSize(s2);
		textX.sync();
		textZ.sync();
		textY.sync();

	}
	
	addLineDimension(obj,start, end){
		// obj.material.wireframe = true;
		
		const dist = start.distanceTo(end);	
		const center = new THREE.Vector3(
			(start.x+end.x)/2,
			2,
			(start.z+end.z)/2
		);	
		const textSize = 0.2	
		let textX = this.createText(
			Math.floor(dist*1000)+'мм',
			center,
			new THREE.Vector3(Math.PI/2, Math.PI, Math.PI),
			textSize
		);
		obj.add(textX)


		textX.sync();
	}

	/**
		Убирает отображение размерных линии и размеры с объекта
	*/
	removeLabel(obj) {
		let temp = [...obj.children];
		for (let c of temp) {
			if (c.userData.isText || c.isLine) {
				obj.remove(c);
				if (c.userData.isText) {
					c.dispose();
				}
			}
		}
	}
	

	
	/**
		Создаёт надпись по указанным координатам
		txt - String - что будет написано
		position - Vector3 - где будет расположен
		rotation - Vector3 - как будет повёрнут
		return: Text
	*/
	createText(txt, position, rotation, textSize) {
		let myText = new Text()
		
		myText.text = txt
		// myText.position.set(
			// position.x, position.y, position.z
		// );
		// myText.rotation.set(
			// rotation.x, rotation.y, rotation.z
		// );
		myText.rotation.set(
			rotation.x, rotation.y, rotation.z
		);
		myText.position.set(
			position.x, position.y, position.z
		);
		
		myText.fontSize = textSize 
		myText.color = 'white'
		myText.outlineWidth = '10%'
		myText.userData.isText = true;
		myText.textAlign = 'center';
		myText.anchorX = '50%';
		
		myText.visible = this.dimensionsVisible;	
		
		return myText;
	}
	
	/**
		Рассчитывает точки, через которые должна проходить размерная линия, отмечающая размер объекта по оси X (длина)
		size - THREE.Vector3() - размер объекта, на которого натягиваем линию
		return : Array:Vector3 - массив с точками
	*/
	getPointsForXLine(size){
		let p0 = new THREE.Vector3(-size.x,size.y,size.z);
		let p1 = new THREE.Vector3(-size.x,size.y,size.z+this.#offset);
		let p2 = new THREE.Vector3(size.x,size.y,size.z+this.#offset);
		let p3 = new THREE.Vector3(size.x,size.y,size.z);
		return [p0,p1,p2,p3];
	}
	getPointsForYLine(size){
		let p0 = new THREE.Vector3(size.x,size.y,size.z);
		let p1 = new THREE.Vector3(size.x+this.#offset,size.y,size.z+this.#offset);
		let p2 = new THREE.Vector3(size.x+this.#offset,-size.y,size.z+this.#offset);
		let p3 = new THREE.Vector3(size.x,-size.y,size.z);
		return [p0,p1,p2,p3];
	}
	/**
		Рассчитывает точки для линии по оси Z
		size - THREE.Vector3() - размер объекта, на которого натягиваем линию
		return : Array:Vector3 - массив с точками
	*/
	getPointsForZLine(size){
		let p0 = new THREE.Vector3(size.x,size.y,size.z);
		let p1 = new THREE.Vector3(size.x+this.#offset,size.y,size.z);
		let p2 = new THREE.Vector3(size.x+this.#offset,size.y,-size.z);
		let p3 = new THREE.Vector3(size.x,size.y,-size.z);
		return [p0,p1,p2,p3];
	}
	/**
		Создаёт линию, проходящую через указанный набор точек.
		points - Array:Vector3 - набор точек для построения линии
		return : THREE.Line
	*/
	createLineFromPoints(points) {
		const material = new THREE.LineBasicMaterial({color: "red"});
		
		const geometry = new THREE.BufferGeometry().setFromPoints( points );

		let line = new THREE.Line(geometry, material);
		line.userData.isLine = true;
		
		line.visible = this.dimensionsVisible;
		
		return line;
	}
	setDimensionsVisibility(bool){
		this.dimensionsVisible = bool;
	}
}