import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

export class ExportManager {
	
	constructor(exporter, assetLoader) {
		this.exporter = exporter;
		this.assetLoader = assetLoader;
		
		this.link = document.createElement('a');
		document.body.appendChild(this.link);
	}
	createBlobFromBuffer(buffer) {
			return new Blob([buffer], {type: 'application/octet-stream'});
	}
	saveToUserDevice(blob, filename) {
		this.link.href = URL.createObjectURL(blob);
		this.link.download = filename;
		this.link.click();
	}
		
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