import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
	Класс, управляющий загрузкой моделей из сцены и на сцену, а так же перемещением моделей между сценами.
*/
export class ExportManager {
	
	/**
		Конструктор класса
		exporter - GLTFExporter
		assetLoader - GLTFLoader
	*/
	constructor(exporter, assetLoader) {
		this.exporter = exporter;
		this.assetLoader = assetLoader;
		
		this.link = document.createElement('a');
		document.body.appendChild(this.link);
	}
	/**
		Возвращает Blob объект из результата работы 
		GLTFExporter.parse().
		Blob объект содержит в себе данные о сцене и позволяет отправить сцену на компьютер пользователя или в другую сцену.
	*/
	createBlobFromBuffer(buffer) {
			return new Blob([buffer], {type: 'application/octet-stream'});
	}
	/**
		Скачивает Blob объект на устройство пользователя.
	*/
	saveToUserDevice(blob, filename) {
		this.link.href = URL.createObjectURL(blob);
		this.link.download = filename;
		this.link.click();
	}
	/**
		Скачивает модели на устройство пользователя.
	*/
	downloadScene(objects) {
		let self = this;
		this.exporter.parse(
				objects,
				function ( result ) {
					let blob = self.createBlobFromBuffer(result);
					self.saveToUserDevice(blob, Math.floor(Math.random()*9999)+'.glb');
				},
				function (error) {
					console.log("An error occured when downloading file! : " + error);
				},
				{
					binary:true
				}
		);
	}
	/**
		Загружает модели из blob объекта на сцену
	*/
	loadBlobToStage(blob, stage) {
		this.link.href = URL.createObjectURL(blob);
		this.assetLoader.load(this.link.href, (gltf)=>{
			const model = gltf.scene;

			stage.applyToMeshes(model, (o)=>{
				o.castShadow = true;
				o.receiveShadow = true;
			});
			
			// let size = new THREE.Box3().setFromObject(model);
			// let length = size.min.x.distanceTo(size.max.x);
			// let height = size.min.y.distanceTo(size.max.y);
			// let width = size.min.z.distanceTo(size.max.z);
			// let mB;
			// if(length >= width && length >= height)
				// mB = length;
			// else if (width >= length && width >= height)
				// mB = width;
			// else 
				// mB= height;
			
			// mB /= 10;
			
			// for(let o of model.children) {
				// let biggest = 0;
				// for (let f of model.children) {
					// if (o === f) continue;
					// let dist = o.position.distanceTo(f.position)
					// if ( dist > mB)
						// biggest = dist;
				// }
			// }
			
			// let con = new THREE.Box3().setFromObject(model);
			// let con_help = new THREE.Box3Helper(con, "red");
			
			// model.add(con);
			// model.add(con_help);
			
			// let pos_origin = new THREE.Vector3(model.position.x, model.position.y, model.position.z);
			// let dir = new THREE.Vector3(model.position.x, model.position.y+10, model.position.z);
			// let arrowhelp = new THREE.ArrowHelper(dir, pos_origin, 5, "green");
			// model.add(arrowhelp);
			
			stage.addObject(model, true, true);
		})
	}

	/**
		Загружает модели на сцену
	*/
	exportToStage(objects, stage) {
		let self = this;
		this.exporter.parse(
				objects,
				function ( result ) {
					let blob = self.createBlobFromBuffer(result);
					self.loadBlobToStage(blob, stage);
				},
				function (error) {
					console.log("An error occured when exporting! : " + error);
				},
				{
					binary:true
				}
		);
	}
}