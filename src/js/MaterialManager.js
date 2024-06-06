import * as THREE from 'three';
import * as utils from './utils.js';

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
			light_brick: ()=>{return self.#createStandardTexturedMaterial("light_brick.jpg", 1.1)},
			hardwood: ()=>{return self.#createStandardTexturedMaterial("hardwood.png",1.3)},
			tile1: ()=>{return self.#createStandardTexturedMaterial("tile-01.jpg",1.5)},
			tile2: ()=>{return self.#createStandardTexturedMaterial("tile-02.jpg",1.5)},
			marbletiles: ()=>{return self.#createStandardTexturedMaterial("marbletiles.jpg",2)},
			wallpaperTwo: ()=>{return self.#createWallTexturedMaterial("wallpaper2.jpg")},
			wallRoundCorner: ()=>{return self.#createCylinderTexturedMaterial('wallpaper2.jpg')},
			redLine: ()=>{return new THREE.LineBasicMaterial({color: 0xEC7063})},
			greenLine: ()=>{return new THREE.LineBasicMaterial({color: 0x52BE80})}
		}
	}
	#loadTexture(filename){
		let texture;
		if (this.loadedTextures.has(filename))
			texture = this.loadedTextures.get(filename);
		else {
			texture = this.textureLoader.load(this.	textureFolderPath+filename);
			this.loadedTextures.set(filename, texture);
		}
		
		return texture;
	}
	/**
		Возвращает объект THREE.MeshStandardMaterial с текстурой filename
	*/
	#createStandardTexturedMaterial(filename, priceCoeff){
		const texture = this.#loadTexture(filename);
		const material = new THREE.MeshStandardMaterial({ map: texture });
		material.userData.priceCoeff = priceCoeff;
		return material;
	}
	#createWallTexturedMaterial(filename){
		const texturedMaterial = this.#createStandardTexturedMaterial(filename);
		const nonTexturedMaterial = new THREE.MeshStandardMaterial({color: 'gray', side: THREE.DoubleSide});

		const multiMaterial = [
			texturedMaterial,
			texturedMaterial,
			nonTexturedMaterial,
			nonTexturedMaterial,
			nonTexturedMaterial,
			nonTexturedMaterial,
		];
		
		return multiMaterial;
	}
	#createCylinderTexturedMaterial(filename){
		const texturedMaterial = this.#createStandardTexturedMaterial(filename);
		const nonTexturedMaterial = new THREE.MeshStandardMaterial({color: 'gray', side: THREE.DoubleSide});
		
		const multiMaterial = [
			nonTexturedMaterial,
			texturedMaterial,
			nonTexturedMaterial,
			nonTexturedMaterial,
			nonTexturedMaterial,
			nonTexturedMaterial,
		];
		
		return multiMaterial;
	}
	/**
		Устанавливает материал для модели
	*/
	setMeshMaterial(mesh, materialKey){
		try {
			mesh.material = this.materials[materialKey]();
			mesh.material.userData.priceCoeff = this.materials[materialKey]().userData.priceCoeff;
		} catch (e) {
			console.error(e);
		}
	}
	/**
		Устанавливает текстуру для модели.
	*/
	setMeshTexture(mesh, materialKey){
		try {
			const map = this.materials[materialKey]().map;
			const priceCoeff = this.materials[materialKey]().userData.priceCoeff;
			console.log(priceCoeff);
			
			utils.applyToMeshes(mesh, (o)=>{
				utils.applyToArrayOrValue(o.material, (m)=>{
					m.map = map;
					m.userData.priceCoeff = priceCoeff;		
					m.needsUpdate = true;
				});
			});
		} catch (e) {
			console.error(e);
		}
	}
	
	getAvailableMaterials(){
		return Object.keys(this.materials);
	}
	getMaterial(key){
		return this.materials[key]();
	}
}