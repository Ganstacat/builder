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
			})
			stage.addObject(model, true, false);
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