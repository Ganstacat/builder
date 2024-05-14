import * as THREE from 'three';

/**
	Класс, хранящий в себе материалы для моделей (объекты класса THREE.*Material) и содержащий методы для изменения материалов объектов
*/
export class MaterialManager {
	
	/**
		Конструктор принимает THREE.TextureLoader() в качестве зависимости.
		Так же во время инициализации устанавливается список материалов и переменная, хранящая путь до папки с текстурами.
	*/
	constructor(textureLoader){
		this.textureLoader = textureLoader;
		this.textureFolderPath = "./assets/textures/";
		this.loadedTextures = new Map();
		
		let self = this;
		this.materials = {
			none: ()=>{return new THREE.MeshStandardMaterial()},
			light_brick: ()=>{return self.createStandardTexturedMaterial("light_brick.jpg")},
			hardwood: ()=>{return self.createStandardTexturedMaterial("hardwood.png")},
			tile1: ()=>{return self.createStandardTexturedMaterial("tile-01.jpg")},
			tile2: ()=>{return self.createStandardTexturedMaterial("tile-02.jpg")},
			marbletiles: ()=>{return self.createStandardTexturedMaterial("marbletiles.jpg")},
		}
	}
	/**
		Возвращает объект THREE.MeshStandardMaterial с текстурой filename
	*/
	createStandardTexturedMaterial(filename){
		let texture;
		if (this.loadedTextures.has(filename))
			texture = this.loadedTextures.get(filename);
		else 
			texture = this.textureLoader.load(this.textureFolderPath+filename);
		
		this.loadedTextures.set(filename, texture);
		
		return new THREE.MeshStandardMaterial({ map: texture });
	}
	/**
		Устанавливает материал для модели
	*/
	setMeshMaterial(mesh, materialKey){
		try {
			mesh.material = this.materials[materialKey]();
		} catch (e) {
			console.error(e);
		}
	}
	/**
		Устанавливает текстуру для модели.
	*/
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