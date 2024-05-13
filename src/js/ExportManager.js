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
		
	downloadScene(objects) {
		function saveArrayBuffer(buffer, filename){
			save(new Blob([buffer], {type:'application/octet-stream'}), filename);
		}

		function save(blob, filename) {
			const link = document.createElement('a');
			document.body.appendChild(link);
			link.href = URL.createObjectURL(blob);
			
			
			link.download = filename;
			link.click();
		}

		this.exporter.parse(
				objects,
				function ( result ) {
					saveArrayBuffer(result,Math.floor(Math.random()*9999)+'.glb');
				},
				function (error) {
					console.log("An error occured when exporting! : " + error);
				},
				{
					binary:true
				}
		);
	}

	exportToStage(objects, stage) {
		function saveArrayBuffer(buffer, filename){
			save(new Blob([buffer], {type:'application/octet-stream'}), filename);
		}

		function save(blob, filename) {
			const link = document.createElement('a');
			document.body.appendChild(link);
			link.href = URL.createObjectURL(blob);
			
			let assetLoader = new GLTFLoader();
			assetLoader.load(link.href, function(gltf){
				const model = gltf.scene;
				for(let child of model.children){
					child.castShadow = true;
				}
				stage.addObject(model,true,false);
				// let newObject = stage.meshFactory.cloneObject(model);
				// stage.scene.add(model);
				// stage.movableObjects.push(model);
				
			}, undefined, function(error){
				console.log(error);
			}); 
			
			link.download = filename;
		}

		this.exporter.parse(
				objects,
				function ( result ) {
					saveArrayBuffer(result,'Scene.glb');
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