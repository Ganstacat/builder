import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {Text} from 'troika-three-text';

/**
	Класс, который управляет размерными линиями.
*/
export class LabelManager {
	constructor () {
		
	}
	/**
		Добавляет размерные линии к объектам
	*/
	addDimensionLines(obj) {
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
		
		
		let textX = this.createText(
			Math.floor(size_copy.x*1000)+'мм',
			new THREE.Vector3(0,size_halved.y,size_halved.z+0.1),
			new THREE.Vector3(Math.PI/2, Math.PI,Math.PI)
		);
		let textZ = this.createText(
			Math.floor(size_copy.z*1000)+'мм',
			new THREE.Vector3(size_halved.x+0.1,size_halved.y,0),
			new THREE.Vector3(Math.PI/2, Math.PI, Math.PI*1.5)
		);
		let textY = this.createText(
			Math.floor(size_copy.y*1000)+'мм',
			new THREE.Vector3(size_halved.x+0.1,0,-size_halved.z-0.1),
			new THREE.Vector3(0,Math.PI/4,Math.PI/2)
		);
		
		obj.add(lineX);
		obj.add(lineZ);
		// obj.add(lineY);
		obj.add(textX)
		obj.add(textZ)
		// obj.add(textY)

		// this.adjustTextScale(textX, size, obj.scale);
		
		// let bx = new THREE.Box3().setFromObject(myText);
		// let s2 = new THREE.Vector3();
		// console.log(bx);
		// bx.getSize(s2);
		textX.sync();
		textZ.sync();
		textY.sync();
	}
	/**
		Создаёт надпись по указанным координатам
		txt - String - что будет написано
		position - Vector3 - где будет расположен
		rotation - Vector3 - как будет повёрнут
		return: Text
	*/
	createText(txt, position, rotation) {
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
		
		myText.fontSize = 0.1
		myText.color = 'white'
		myText.userData.isText = true;
		myText.textAlign = 'center';
		myText.anchorX = '50%';
		
		
		
		return myText;
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
		Рассчитывает точки, через которые должна проходить размерная линия, отмечающая размер объекта по оси X (длина)
		size - THREE.Vector3() - размер объекта, на которого натягиваем линию
		return : Array:Vector3 - массив с точками
	*/
	getPointsForXLine(size){
		let p0 = new THREE.Vector3(-size.x,size.y,size.z);
		let p1 = new THREE.Vector3(-size.x,size.y,size.z+0.1);
		let p2 = new THREE.Vector3(size.x,size.y,size.z+0.1);
		let p3 = new THREE.Vector3(size.x,size.y,size.z);
		return [p0,p1,p2,p3];
	}
	getPointsForYLine(size){
		let p0 = new THREE.Vector3(size.x,size.y,-size.z);
		let p1 = new THREE.Vector3(size.x+0.1,size.y,-size.z-0.1);
		let p2 = new THREE.Vector3(size.x+0.1,-size.y,-size.z-0.1);
		let p3 = new THREE.Vector3(size.x,-size.y,-size.z);
		return [p0,p1,p2,p3];
	}
	/**
		Рассчитывает точки для линии по оси Z
		size - THREE.Vector3() - размер объекта, на которого натягиваем линию
		return : Array:Vector3 - массив с точками
	*/
	getPointsForZLine(size){
		let p0 = new THREE.Vector3(size.x,size.y,size.z);
		let p1 = new THREE.Vector3(size.x+0.1,size.y,size.z);
		let p2 = new THREE.Vector3(size.x+0.1,size.y,-size.z);
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
		return line;
	}
	
	/**
		Корректирует маштаб текста, чтобы он не выглядел сжатым или растянутым после изменения маштаба родительского объекта
		txt - Text
		parentSize - THREE.Vector3()
		parentScale - THREE.Vector3()
	*/
	adjustTextScale(txt, parentSize, parentScale){
		let origSize = new THREE.Vector3(
			parentSize.x / parentScale.x,
			parentSize.y / parentScale.y,
			parentSize.z / parentScale.z,
		);
		let textScale = new THREE.Vector3(
			origSize.x / parentSize.x,
			origSize.y / parentSize.y,
			origSize.z / parentSize.z,		
		);
		console.log(`adjusted scale: x:${textScale.x}|y:${textScale.y}|z:${textScale.z}`);
		txt.scale.set(textScale.x, textScale.y, textScale.z);
	}
}