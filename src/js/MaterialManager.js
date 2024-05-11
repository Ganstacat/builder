import * as THREE from 'three';

export class MaterialManager {
	constructor(textureLoader){
		this.textureLoader = textureLoader;
		this.textureFolderPath = "./assets/textures/";
		this.loadedTextures = new Map();
		
		let self = this;
		this.materials = {
			light_brick: ()=>{return self.createStandardTexturedMaterial("light_brick.jpg")},
			hardwood: ()=>{return self.createStandardTexturedMaterial("hardwood.png")},
			tile1: ()=>{return self.createStandardTexturedMaterial("tile-01.jpg")},
			tile2: ()=>{return self.createStandardTexturedMaterial("tile-02.jpg")},
			marbletiles: ()=>{return self.createStandardTexturedMaterial("marbletiles.jpg")},
		}
	}
	createStandardTexturedMaterial(filename){
		let texture;
		if (this.loadedTextures.has(filename))
			texture = this.loadedTextures.get(filename);
		else 
			texture = this.textureLoader.load(this.textureFolderPath+filename);
		
		this.loadedTextures.set(filename, texture);
		
		return new THREE.MeshStandardMaterial({ map: texture });
	}
	setMeshMaterial(mesh, materialKey){
		try {
			mesh.material = this.materials[materialKey]();
		} catch (e) {
			console.error(e);
		}
	}
	setMeshTexture(mesh, materialKey){
		try {
			let map = this.materials[materialKey]().map;
			
			mesh.material.map = this.materials[materialKey]().map;
			mesh.material.needsUpdate = true;
		} catch (e) {
			console.error(e);
		}
	}
}