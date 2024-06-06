import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as utils from './utils.js';
import {OBB} from 'three/examples/jsm/math/OBB.js';
import { calculatePrice } from './priceCalculator.js';

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
		return this.loadByAssetLoader(this.link.href, stage);
	}
	loadByLinkToStage(link, stage) {
		return this.loadByAssetLoader(link, stage);
	}
	loadByAssetLoader(obj, stage){
		return new Promise((resolve, reject)=>{
			this.assetLoader.load(obj, (gltf) => {
				try {
					const model = gltf.scene;
					this.#addShadows(model);

					// Определить, какие модельки находятся рядом и сгруппировать их вместе
					let groups = this.#groupNearestModels(model);
					// объединить разные группы, если они содержат общих потомков (union) - типа [1,2,3] и [3,4,5] объединится в [1,2,3,4,5]
					groups = this.#unionGroups(groups);
					// добавить модельки в сцену. Сделать поправку на их положение в текущей сцене.
					this.#addGroupsToStage(groups, stage);
					resolve('done');
				} catch (error) {
					reject(error);		
				}
			})
		});
	}
	#addShadows(models){
		utils.applyToMeshes(models, (o) => {
			o.castShadow = true;
			o.receiveShadow = true;
		});
	}
	#groupNearestModels(models){
		let groups = [];
		for (let o of models.children) {
			groups.push([o]);
			let index = groups.length - 1;
			for (let c of models.children) {
				if (o === c) continue;
				let oB = new THREE.Box3().setFromObject(o);
				let cB = new THREE.Box3().setFromObject(c);

				let distances = [];


				let p1 = utils.getBox3Points(oB);
				let p2 = utils.getBox3Points(cB);
				for (let p of p1) {
					distances.push(cB.distanceToPoint(p));
				}
				for (let p of p2) {
					distances.push(oB.distanceToPoint(p));
				}

				let shortest = 99;
				for (let d of distances) {
					if (d < shortest)
						shortest = d;
				}
				if (shortest < 0.1) {
					groups[index].push(c);
				}
			}
		}
		return groups;
	}
	#unionGroups(groups){
		for (let i = 0; i < groups.length; i++) {
			if (!groups[i]) continue;
			for (let j = 0; j < groups.length; j++) {
				if (!groups[j] || groups[i] === groups[j]) continue;
				let intersection = groups[i].filter(x => groups[j].includes(x));
				if (intersection.length > 0) {
					let union = [...new Set([...groups[i], ...groups[j]])];
					groups[i] = union;
					groups[j] = null;
				}
			}
		}
		return groups;
	}
	#addGroupsToStage(groups, stage){
		for (let g of groups) {
			if (!g) continue;

			let group = new THREE.Group();
			for (let m of g) {
				this.#fixBadOBB(m);
				group.add(m);
			}
			const groupCenter = this.#adjustChildrenPositionByGroupCenter(group);
			let container = new THREE.Group();
			container.name = 'container';
			group.name = 'models';
			container.add(group);

			stage.addObject(container, true, true, true, false);
			container.position.copy(groupCenter);
		}
	}
	#fixBadOBB(obj){
		utils.applyToMeshes(obj, (o) => {
			const badObb = o.geometry.userData.obb;
			o.geometry.userData.obb = new OBB(badObb.center, badObb.halfSize, badObb.rotation);
			o.userData.obb = new OBB();
		});
	}
	#adjustChildrenPositionByGroupCenter(group){
		const pos = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());

		for (let m of group.children) {
			m.position.x -= pos.x;
			m.position.y -= pos.y;
			m.position.z -= pos.z;
		}
		return pos;
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

	saveToDatabase(objects, apiUrl) {
		let self = this;
		const price = calculatePrice(objects);
		apiUrl += `&price=${price}`;
		this.exporter.parse(
			objects,
			(result)=>{
				const blob = self.createBlobFromBuffer(result);
				self.sendBlobWithHttpPost(apiUrl, blob);
			},
			(error)=>{
				console.error(error);
			},
			{
				binary:true
			}
		)
	}
	sendBlobWithHttpPost(theUrl, blob)
	{
		fetch(theUrl, {method:"POST", body:blob})
			.then(res=>console.log(res.text()))
	}	

}