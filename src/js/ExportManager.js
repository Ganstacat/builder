import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as utils from './utils.js';
import {OBB} from 'three/examples/jsm/math/OBB.js';

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

			utils.applyToMeshes(model, (o)=>{
				o.castShadow = true;
				o.receiveShadow = true;
			});
			
			
			// Определить, какие модельки находятся рядом и сгруппировать их вместе
			let groups =  [];
			for(let o of model.children) {
				groups.push([o]);
				let index = groups.length - 1;
				for(let c of model.children) {
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
					for(let d of distances) {
						if(d < shortest)
							shortest = d;
					}
					if (shortest < 0.1) {
						groups[index].push(c);
					}
				}
			}
			// объединить разные группы, если они содержат общих потомков (union) - типа [1,2,3] и [3,4,5] объединится в [1,2,3,4,5]
			for(let i = 0; i < groups.length; i++) {
				if (!groups[i]) continue;
				for(let j = 0; j < groups.length; j++) {
					if(!groups[j] || groups[i] === groups[j]) continue;
					let intersection = groups[i].filter(x => groups[j].includes(x));
					if (intersection.length > 0) {
						let union = [...new Set([...groups[i], ...groups[j]])];
						groups[i] = union;
						groups[j] = null;
					}
				}
			}
			
			// добавить модельки в сцену. Сделать поправку на их положение в текущей сцене.
			console.log('Adding groups');
			for (let g of groups) {
				if(!g) continue;
				
				// let group = new THREE.Group();
				// for (let m of g) {
				// 	group.add(m);
				// }
				// let pos = new THREE.Vector3();
				// new THREE.Box3().setFromObject(group).getCenter(pos);
				
				// for (let m of group.children) {
				// 	m.position.x -= pos.x;
				// 	m.position.y -= pos.y;
				// 	m.position.z -= pos.z;
				// }
				// let container = new THREE.Group();
				// container.name = 'container';
				// group.name = 'models';
				// container.add(group);
				
				// stage.addObject(container, true, true, true);
				// container.position.copy(pos);
				// console.log(g);
				// console.log(container);

				utils.applyToMeshes(g[0], (o)=>{
					const badObb = o.geometry.userData.obb;
					console.log(o.geometry);
					o.geometry.userData.obb = new OBB(badObb.center, badObb.halfSize, badObb.rotation);
					o.userData.obb = new OBB();
				});
				stage.addObject(g[0], true, true, true);
				
			}
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