import * as THREE from 'three';
import {Stage} from './Stage.js';
import * as utils from './utils.js'; 
import {OBB} from 'three/examples/jsm/math/OBB.js';

/**
	Класс, добавляющий управление моделями с помощью мыши, и так же просчитывающий коллизии между моделями и ограничителями
	
	Этот класс надо поделить на коллизии, выбор мышью, перемещение мышью
	
	Ещё он дёргает напрямую объекты из stage, хотя должен получать их от контроллера. Наверное.
*/
export class DragEnginePlane {
	/**
		Инициализация необходимых переменных.
		Так же этому классу требуется объект класса Stage для работы, но он передаётся не в конструкторе, а с помощью отдельного метода.
	*/
	constructor() {
		this.mousePosition = new THREE.Vector2();
		this.planeIntersect = new THREE.Vector3();
		this.dragObject;
		this.pIntersect = new THREE.Vector3();
		this.shift = new THREE.Vector3();
		this.pNormalHorizontal = new THREE.Vector3(0,1,0);
		this.pNormalVertical = new THREE.Vector3(0,0,1);
		this.pNormal = this.pNormalHorizontal;
		this.planeDrag = new THREE.Plane(new THREE.Vector3(0,0,0));
		
		this.lockX = false;
		this.lockY = false;
		this.lockZ = false;
		
		this.collision = false;
		this.dragging = true;
	}
	setDragging(bool){
		this.dragging = bool;
	}
	/**
		Добавляет отслеживание мыши на сцене, чтобы пользователь мог перемещать модели с помощью мыши.
	*/
	addEventListenersToStage() {
		let self = this;
		
		// Движение мыши: перемещение выбранный предмет
		this.stage.renderer.domElement.addEventListener('pointermove', function(e) {
			self.calculateRayToPointer(e.offsetX, e.offsetY);
			if (self.dragObject && self.dragging) self.drag();
		});

		// Нажатие любой кнопки мыши: выбрать модель, если курсор находится на ней
		this.stage.renderer.domElement.addEventListener('pointerdown', function(){
			if(self.dragging) self.tryPickup();
		});
		
		// Нажатие любой кнопки мыши: если мышь выбрала какую-то модель, то информируем объект сцены об этом.
		// Этот слушатель переедет в другое место, скорее всего, в контроллер.
		this.stage.renderer.domElement.addEventListener('pointerdown', function(){

			if(self.dragObject) {
				self.stage.setSelectedObject(self.dragObject);
			} else {
				// по сути два раза смотрим пересечения с объектами. Нот грейт.
				let obj = self.selectObject(self.stage.scene.children);
				if (obj) self.stage.setSelectedObject(obj);
			}
			
		});
		// Отпускание кнопки мыши: прекратить перемещение объекта
		this.stage.renderer.domElement.addEventListener("pointerup", function(){
			self.drop();
		});
	

	}
	
	setCollision(bool){
		this.collision = bool;
	}
	isCollisionEnabled(){
		return this.collision;
	}
	/**
		Убирает блокировку оси перемещения.
	*/
	resetLocks() {
		this.lockX = false; this.lockY = false; this.lockZ = false;
		this.pNormal = this.pNormalHorizontal;
	}
	lockAxis(axis) {
		this.resetLocks();
		switch(axis){
			case 'x': this.lockX = true; break;
			case 'z': this.lockZ = true; break;
			case 'y': this.lockY = true; 
				this.pNormal = this.pNormalVertical;
				break;
		}
		this.tryPickup();
	}
	
	/**
		Проверяет, находится ли курсор на какой-то модели, которую можно выбрать, и вызывает this.pickup(), если это так.
	*/
	tryPickup() {

		let intersects = this.stage.raycaster.intersectObjects(this.stage.movableObjects);
		
		if(intersects.length >0) {
			let index = 0;
			while (!intersects[index].object.isMesh) {
				index++;
				if (index >= intersects.length) return;
			}
			
			let obj = this.getRootParentGroup(intersects[index].object);
			let point = intersects[index].point;
			this.pickup(point, obj);
			// console.log(obj);
		}
	}
	
	/**
		То же самое, что и верхняя tryPickup(), но тот работает только на movableObjects, а этот на тот список, что передан в массиве. Это говно и надо переделать. 
	*/
	selectObject(objectlist) {
		let intersects = this.stage.raycaster.intersectObjects(objectlist);
		if(intersects.length > 0 && intersects[0].object.userData.isSelectable)
			return this.getRootParentGroup(intersects[0].object);
		else
			return null;
	}
	setPlaneNormal(normal){
		this.pNormal = normal;
		this.planeDrag.setFromNormalAndCoplanarPoint(this.pNormal, this.pIntersect);
		// может быть ещё надо тащить dragObject и пересчитывать shift?
		
		// this.shift.subVectors(this.dragObject.position, this.pIntersect);
	}
	
	/**
		Начать перемещение модели
	*/
	pickup(intersectionPoint, obj) {
		this.stage.controls.enabled = false;
		this.dragObject = obj;


		if(this.dragObject.userData.onPickup) this.dragObject.userData.onPickup(); 

	
		this.pIntersect.copy(intersectionPoint);
		
		this.planeDrag.setFromNormalAndCoplanarPoint(this.pNormal, this.pIntersect);
		
		this.shift.subVectors(obj.position, intersectionPoint);
	}
	/**
		Прекратить перемещение модели
	*/
	drop() {
		if (!this.dragObject) return;

		if(this.dragObject.userData.onDrop) this.dragObject.userData.onDrop(); 

		this.dragObject = null;
		this.stage.controls.enabled = true;
	}

	
	/**
		Перемещать выбранную модель к курсору мыши с учётом блокировки по осям, ограничений и коллизий.
	*/
	drag() {
		this.stage.raycaster.setFromCamera(this.mousePosition, this.stage.camera);
		this.stage.raycaster.ray.intersectPlane(this.planeDrag, this.planeIntersect);
		
		const oldpos = this.dragObject.position.clone();
		
		this.dragObject.position.addVectors(this.planeIntersect, this.shift);
		

		
		utils.doWithoutLabels(this.dragObject, (o)=>{
			this.applyCollision(o, oldpos);
			this.applyAxisLock(o, oldpos);
			this.applyRestraint(o);
		});
		if(!this.dragging){
			utils.snapPoint(this.dragObject.position);
		}	
		
		if(this.dragObject && this.dragObject.userData.onMove) this.dragObject.userData.onMove(oldpos, this.dragObject.position);
		
	}
	
	snapObjectToBox3(obj, box3){
		this.stage.scaleObjToBox3(obj, box3);
		this.stage.setRestraint(obj, box3);
	}
	
	/**
		Ограничить перемещение модели в случае, если включена блокировка какой-то из осей.
	*/
	applyAxisLock(obj, pos) {
		if (this.lockX) {
			obj.position.y = pos.y;
			obj.position.z = pos.z;
		} else if (this.lockY) {
			obj.position.x = pos.x;
			obj.position.z = pos.z;
		} else if (this.lockZ) {
			obj.position.y = pos.y;
			obj.position.x = pos.x;
		}
	}
	
	/**
		Применить ограничение на перемещение модели, в случае если коллизии активированы и в объекте модели эти коллизии прописаны.
		Если какая-то из сторон куба вышла за пределы ограничителя, то позиция корректируется так, чтобы вернуть модель обратно внутрь ограничителя.
	*/
	applyRestraint(obj) {
		if (!this.collision || obj.userData.isNotAffectedByCollision) return;
		let restraint = obj.userData.restraint;
		if(restraint)
			obj.position.clamp( restraint.min,restraint.max );
	}
	
	/*
		Применить коллизию: если перемещаемая модель столкнулась с другой моделью, у которой есть коллизия, то пересчитываем позицию перемещаемой модели так, чтобы коллизионные коробки двух моделей не пересекались.
	**/
	applyCollision(obj, oldpos, noLimit) {
		if (!this.collision || obj.userData.isNotAffectedByCollision) return;
		
		
		for(let colobj of this.stage.objectsWithCollision) {
			if (obj === colobj) continue;
			if (obj === this.getRootParentGroup(colobj)) continue;
			
			
			const objGroup = utils.getModelsGroup(obj);
			let objMesh;
			
			utils.applyToMeshes(objGroup, o=>{
				objMesh = o;
			});
			// utils.applyToMeshes(colobj, o=>{
			// 	if(o.parent.name === 'models') colObjMesh = o;
			// });
			
			const obb = objMesh.userData.obb;
			const colObb = colobj.userData.obb;
	
			if (this.hasIntersection(obb, colObb)) {
				let prevpos = obj.position.clone();
				let clampPoint = new THREE.Vector3();
				let halfSize = obb.halfSize;
				
				colObb.clampPoint(obj.position, clampPoint);
				
				const clampDist = prevpos.distanceTo(clampPoint);
			
				if(clampDist > 0.01 && clampDist < halfSize.x+halfSize.z){
					obj.position.set(clampPoint.x, clampPoint.y, clampPoint.z);
					
					
					let dragbbox = new THREE.Box3().setFromObject(obj);
					let halfLength = (dragbbox.max.x - dragbbox.min.x)/2;
					let halfHeight = (dragbbox.max.y - dragbbox.min.y)/2;
					let halfWidth  = (dragbbox.max.z - dragbbox.min.z)/2;
					
					
					let dragpos = obj.position;
					if(prevpos.x < dragpos.x) {
						dragpos.x -= halfLength;
					} else if (prevpos.x > dragpos.x) {
						dragpos.x += halfLength;
					}
					if(prevpos.z < dragpos.z) {
						dragpos.z -= halfWidth;
					} else if (prevpos.z > dragpos.z) {
						dragpos.z += halfWidth;
					}
					// if(prevpos.y < dragpos.y) {
						// dragpos.y -= halfHeight;
					// } else if (prevpos.y > dragpos.y) {
						// dragpos.y += halfHeight;
					// }
				
					// let dragpos = obj.position;
					// if(prevpos.x < dragpos.x) {
						// dragpos.x -= halfSize.x;
					// } else if (prevpos.x > dragpos.x) {
						// dragpos.x += halfSize.x;
					// }
					// if(prevpos.z < dragpos.z) {
						// dragpos.z -= halfSize.z;
					// } else if (prevpos.z > dragpos.z) {
						// dragpos.z += halfSize.z;
					// }
					// if(prevpos.y < dragpos.y) {
						// dragpos.y -= halfSize.y;
					// } else if (prevpos.y > dragpos.y) {
						// dragpos.y += halfSize.y;
					// }
				}
			}
		}
	}

	applyCollision_old(obj, oldpos, noLimit) {
		
		if (!this.collision || obj.userData.isNotAffectedByCollision) return;
		if (!obj.userData.collisionDelay) {obj.userData.collisionDelay = 0}
		if (obj.userData.collisionDelay > 0) {
			obj.userData.collisionDelay--;
			return;
		}
		
		// вынимаем линии из потомков объекта, чтобы они не учавствовали в коллизии
		let tempchild1 = [];
		let chiCopy1 = [...obj.children];
		for (let c of chiCopy1) {
			if (c.isLine || c.userData.isText) {
				tempchild1.push(c);
				obj.remove(c);
			}
		}
		
		let collisions = 0;
		for(let colobj of this.stage.objectsWithCollision) {
			if (obj === colobj) continue;
			if (obj === this.getRootParentGroup(colobj)) continue;
			
			
			let tempchild2 = [];
			let chiCopy2 = [...colobj.children]
			for (let c of chiCopy2) {
				if (c.isLine || c.userData.isText) {
					tempchild2.push(c);
					colobj.remove(c);
				}
			}
			
			let objMesh, colObjMesh;
			utils.applyToMeshes(obj, o=>{
				if(o.parent.name === 'models') objMesh = o;
			});
			utils.applyToMeshes(colobj, o=>{
				if(o.parent.name === 'models') colObjMesh = o;
			});
			
			const obb = objMesh.userData.obb;
			const colObb = colObjMesh.userData.obb;
	
			if (this.hasIntersection(obb, colObb)) {
				// if (!obj.userData.phantom){
					
					// this.dragObject = utils.cloneObject(obj);
					
					// utils.applyToMeshes(this.dragObject,(o)=>{
						// o.material.emissive.set('red');
					// });
					
					// this.dragObject.userData.phantom = true;
					// this.dragObject.userData.origObj = obj;
					// this.dragObject.stuckObject = colobj;
					// this.stage.addObject(this.dragObject,true);
				// } else {
					// collisions++;
				// }
				
				let prevpos = obj.position.clone();
				let clampPoint = new THREE.Vector3();
				let halfSize = obb.halfSize;
				
				colObb.clampPoint(obj.position, clampPoint);
				
				const clampDist = prevpos.distanceTo(clampPoint);
			
				if(clampDist > 0.01 && clampDist < halfSize.x+halfSize.z){
					obj.position.set(clampPoint.x, clampPoint.y, clampPoint.z);
				
					console.log(obj.rotation);
				
					let dragpos = obj.position;
					if(prevpos.x < dragpos.x) {
						dragpos.x -= halfSize.x;
					} else if (prevpos.x > dragpos.x) {
						dragpos.x += halfSize.x;
					}
					if(prevpos.z < dragpos.z) {
						dragpos.z -= halfSize.z;
					} else if (prevpos.z > dragpos.z) {
						dragpos.z += halfSize.z;
					}
					if(prevpos.y < dragpos.y) {
						dragpos.y -= halfSize.y;
					} else if (prevpos.y > dragpos.y) {
						dragpos.y += halfSize.y;
					}
				}
				
				
				
			}	
			
				
				

				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				// let colbbox = colobj.isBox3 ? colobj : new THREE.Box3().setFromObject(colobj);
				// obj.position.clamp(colbbox.min, colbbox.max);
				
				// // let con_help1 = new THREE.Box3Helper(colbbox, "blue");
				// // this.stage.scene.add(con_help1);
				
				// /*	
					// после применения dragObject.position.clamp, центр таскаемого объекта встаёт 
					// на одну из граней того объекта, с котором приозошла коллизия (коллизионный объект).
					// "код" ниже выталкивает таскаемый объект за пределы коллизионного объекта
				
					// Схема: линии это границы таскаемого объекта, единицы - границы коллизионного.
					// После клемпа			После портянки ниже
						// 11111111					11111111
					// |---1---|  1			|-------1	   1
					// |	1   |  1     =>		|		1	   1
					// |___11111111			|_______11111111
				// */
				
				// let dragbbox = new THREE.Box3().setFromObject(obj);
				// let halfLength = (dragbbox.max.x - dragbbox.min.x)/2;
				// let halfHeight = (dragbbox.max.y - dragbbox.min.y)/2;
				// let halfWidth  = (dragbbox.max.z - dragbbox.min.z)/2;
				
				
				// let dragpos = obj.position;
				// if(prevpos.x < dragpos.x) {
					// dragpos.x -= halfLength;
				// } else if (prevpos.x > dragpos.x) {
					// dragpos.x += halfLength;
				// }
				// if(prevpos.z < dragpos.z) {
					// dragpos.z -= halfWidth;
				// } else if (prevpos.z > dragpos.z) {
					// dragpos.z += halfWidth;
				// }
				// if(prevpos.y < dragpos.y) {
					// dragpos.y -= halfHeight;
				// } else if (prevpos.y > dragpos.y) {
					// dragpos.y += halfHeight;
				// }

			for (let c of tempchild2) {
				colobj.add(c);
			}
		}
		for (let c of tempchild1) {
			obj.add(c);
		}
		
		if (obj.userData.phantom && collisions === 0) {
			obj.userData.collisionTicks = obj.userData.collisionTicks ? obj.userData.collisionTicks-1 : 2;
		}
		if (obj.userData.phantom && obj.userData.collisionTicks <= 0) {
			this.dragObject = obj.userData.origObj;
			this.dragObject.position.set(obj.position.x,obj.position.y,obj.position.z);
			this.dragObject.userData.collisionDelay = 10;
			this.stage.removeObject(obj);
		}
	}
	
	/**
		Рассчитывает нормализованное положение мыши в сцене.
		В окне браузера положение мышии выражается в количестве пикселей от левого верхнего угла страницы с поправкой на прокрутку окна.
		Например, если окно состоит из 1920 x 600 пикселей, то курсор, установленный в центре будет иметь координаты 
		(960, 300)
		
		В сцене рендера же для определения положения курсора используются нормализованные координаты: центр экрана считается за точку (0,0), левый верхний угол (-1,-1) и правый нижний (1,1).

		Рассчитывать нужно, чтобы определить, на какую модель в сцене указывает курсор.
	*/
	calculateRayToPointer(pointerX, pointerY) {
		let canvas = this.stage.renderer.domElement;
		this.mousePosition.x = (pointerX / canvas.clientWidth) * 2 - 1;
		this.mousePosition.y = - (pointerY / canvas.clientHeight) * 2 + 1;
		
		this.stage.raycaster.setFromCamera(this.mousePosition, this.stage.camera);			
		
	}
	
	/**
		Проверяет, пересекаются ли два объекта или нет. Используется при определении коллизии.
	*/
	hasIntersection(obb1, obb2) {
		// let obj1Mesh, obj2Mesh;
		// utils.applyToMeshes(obj1, (obj)=>{
			// if(obj.parent.name === 'models') obj1Mesh = obj;
		// });
		// utils.applyToMeshes(obj2, (obj)=>{
			// if(obj.parent.name === 'models') obj2Mesh = obj;
		// });
		
		// const obb1 = obj1Mesh.userData.obb;
		// const obb2 = obj2Mesh.userData.obb;
		
		return obb1.intersectsOBB(obb2);
	}
	#hasIntersection_copy(obj1, obj2) {		
		let colbox1 = new THREE.Box3();
		let colbox2 = new THREE.Box3();
		
		colbox1 = obj1.isBox3 ? obj1 : colbox1.setFromObject(obj1);
		colbox2 = obj2.isBox3 ? obj2 : colbox2.setFromObject(obj2);

		return colbox1.intersectsBox(colbox2);
	}
	objIntersectsWithBox3(obj){
		const objbox = new THREE.Box3().setFromObject(obj);
		for (let b of this.stage.box3s){
			if (objbox.intersectsBox(b)) return b;
		}
		return false;
	}
	// pointIntersectsWithBox3(point){
	// 	for (let b of this.stage.box3s){
	// 		if (b.containsPoint(point)) return b;
	// 	}
	// 	return false;
	// }
	cursorIntersectsBox3s(){
		this.stage.raycaster.setFromCamera(this.mousePosition, this.stage.camera);
		let resultBox;
		let prevDist;
		for (let b of this.stage.box3s){
			const intersectionPoint = new THREE.Vector3(); 
			const doIntersect = this.stage.raycaster.ray.intersectBox(b, intersectionPoint);
			if(doIntersect) {
				if(!resultBox) {
					resultBox = b;
					prevDist = this.stage.camera.position.distanceTo(intersectionPoint);
				}

				const currDist = this.stage.camera.position.distanceTo(intersectionPoint);
				if (prevDist > currDist) {
					resultBox = b;
					prevDist = currDist;
				}
			}
		}

		return resultBox;
	}

	/**
		Выбирает самого верхнего предка модели, не являющегося сценой.
		Возможно, этот метод переедет в контроллер.
	*/
	getRootParentGroup(obj) {
		let objParent = obj;
		while (objParent.parent && !objParent.parent.isScene) {
			objParent = objParent.parent;
		}
		return objParent;
	}
	
	/**
		Устанавливает сцену, на которой будут перемещаться модели.
	*/
	setStage(stage) {
		this.stage = stage;
	}
	getDraggingPlane(){
		return this.planeDrag;
	}
}