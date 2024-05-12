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
		
	
	saveArrayBuffer(buffer, filename){
		this.save(new Blob([buffer], {type:'application/octet-stream'}), filename);
	}
	
	save(blob, filename) {
		this.link.href = URL.createObjectURL(blob);
		
		// assetLoader.load(link.href, function(gltf){
			// const model = gltf.scene;
			// console.log(model);
			// for(let child of model.children){
				// child.castShadow = true;
			// }
			// floorStage.scene.add(model);
			// floorStage.movableObjects.push(model);
			// model.position.set(0,0,0);
			
		// }, undefined, function(error){
			// console.log(error);
		// }); 
		
		this.link.download = filename;
	}
	download() {
		this.link.click();
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
				console.log(model);
				for(let child of model.children){
					child.castShadow = true;
				}
				stage.scene.add(model);
				stage.movableObjects.push(model);
				model.position.set(0,0,0);
				
			}, undefined, function(error){
				console.log(error);
			}); 
			
			link.download = filename;
			// link.click();
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
		
		
		
		
		
		
		
		
		
		
		
		// let self = this;
		// let filename = 'scene.glb';
		// this.exporter.parse(
			// stage.movableObjects,
			// function (res) {
				// self.saveArrayBuffer(res, 'scene.glb');
			// },
			// function (error) {
				// throw error
			// },
			// {
				// binary: true
			// }
		// );
		
		// this.assetLoader.load(this.link.href, function(gltf){
			// const model = gltf.scene;
			// for(let child of model.children){
				// child.castShadow = true;
			// }
			// stage.addObject(model, true, false);
			// model.position.set(0,0,0);
			
		// }, undefined, function(error){
			// console.log(error);
		// }); 
		// this.link.download = filename;
		// this.link.click();
		
		
		// let group = new THREE.Group();
		// for(let o of objects)
			// group.add(stage.meshFactory.cloneObject(o));
		// stage.addObject(group, true, false);
	}
}