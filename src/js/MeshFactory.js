import * as THREE from 'three';
import  {Stage} from './Stage.js';
// import  {RestrainedMesh} from './RestrainedMesh.js';
import {Text} from 'troika-three-text'
import {LabelManager} from './LabelManager.js';

/**
	Класс, отвечающий за создание новых моделей на сцене.
	Todo: у этого класса на самом деле не должно быть зависимости от сцены
*/
export class MeshFactory {
	
	/*
		объект класса Stage определён как зависимость в конструкторе
		Возможно ПЕРЕПИСАТЬ, т.к. сейчас MeshFactory привязан к одной сцене, хотя в этом нет необходимости. Надо сделать на манер DragEnginePlane
		
		UPD: необходимость таки есть, для объектов Scene.addStartingObjects 
	**/
	constructor(stage, labelManager) {
		this.stage = stage;
		this.labelManager = labelManager;
	}
	/**
		Создать модель, используя данные о её геометрии, материале, а так же двух параметров - можно ли модель перемещать и имеет ли она коллизию.
	*/
	createMesh(geometry, material) {
		let mesh = new THREE.Mesh(geometry, material);
		mesh.geometry.computeBoundingBox();
		
		let modelGroup = new THREE.Group();
		let containerGroup = new THREE.Group();
		modelGroup.name = 'models';
		modelGroup.add(mesh);
		containerGroup.name = 'container';
		containerGroup.add(modelGroup);
		// this.labelManager.addDimensionLines(containerGroup);
		
		return containerGroup;
	}
	/**
		Создать дубликат какого-то объекта - либо модели, либо модели с ограничением, либо группы моделей.
	*/
	cloneObject(grp) {
		let newobj = grp.clone();
		this.stage.applyToMeshes(newobj, (o)=>{
			o.material = o.material.clone();
		});
		return newobj;
	}


	/**
		Установить объект, над которым будет работать этот класс.
	*/
	setStage(stage) {
		this.stage = stage;
	}
}