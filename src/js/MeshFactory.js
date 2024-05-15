import * as THREE from 'three';
import  {Stage} from './Stage.js';
import  {RestrainedMesh} from './RestrainedMesh.js';

/**
	Класс, отвечающий за создание новых моделей на сцене.
*/
export class MeshFactory {
	
	/*
		объект класса Stage определён как зависимость в конструкторе
		Возможно ПЕРЕПИСАТЬ, т.к. сейчас MeshFactory привязан к одной сцене, хотя в этом нет необходимости. Надо сделать на манер DragEnginePlane
		
		UPD: необходимость таки есть, для объектов Scene.addStartingObjects 
	**/
	constructor(stage) {
		this.stage = stage;
	}
	/**
		Создать модель, используя данные о её геометрии, материале, а так же двух параметров - можно ли модель перемещать и имеет ли она коллизию.
		ПЕРЕПИСАТЬ - вместо this.stage.scene надо обращаться к stage.addObject()
	*/
	createMesh(geometry, material, isMovable, hasCollision) {
		const mesh = new THREE.Mesh(geometry, material);
		this.stage.scene.add(mesh);
		mesh.geometry.computeBoundingBox();

		if (isMovable) {
			this.stage.movableObjects.push(mesh);
			mesh.userData.isMovable = true;
		}
		if (hasCollision) {
			this.stage.objectsWithCollision.push(mesh);
			mesh.userData.hasCollision = true;
		}
		return mesh;
	}
	/**
		Создать модель, так же, как и в методе createMesh(), но с добавлением ограничения на перемещение этой модели.
		ПЕРЕПИСАТЬ - вместо this.stage.scene надо обращаться к stage.addObject()
	*/
	createRestrainedMesh(geometry, material, isMovable, hasCollision, restraint) {
		const mesh = new RestrainedMesh(geometry, material);
		this.stage.scene.add(mesh);
		mesh.geometry.computeBoundingBox();
		mesh.setRestraint(restraint);
		
		if (isMovable) {
			this.stage.movableObjects.push(mesh);
			mesh.userData.isMovable = true;
		}
		if (hasCollision) {
			this.stage.objectsWithCollision.push(mesh);
			mesh.userData.hasCollision = true;
		}
		
		mesh.userData.isRestrainedMesh = true;
		return mesh;
	}
	/**
		Создать дубликат какого-то объекта - либо модели, либо модели с ограничением, либо группы моделей.
	*/
	cloneObject(grp) {
		let newobj = grp.clone();
		this.stage.applyToMeshes(newobj, (o)=>{
			o.material = o.material.clone();
		})
		this.stage.addObject(newobj, true, true);
		return newobj;
	}
	
	/**
		Установить объект, над которым будет работать этот класс.
	*/
	setStage(stage) {
		this.stage = stage;
	}
}