import * as THREE from 'three';
import  {Stage} from './Stage.js';

/**
	Класс, добавляющий управление моделями с помощью мыши, и так же просчитывающий коллизии между моделями и ограничителями
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
		
		this.collision = true;
	}
	/**
		Добавляет отслеживание мыши на сцене, чтобы пользователь мог перемещать модели с помощью мыши.
	*/
	addEventListenersToStage() {
		let self = this;
		
		// Движение мыши: перемещение выбранный предмет
		this.stage.renderer.domElement.addEventListener('pointermove', function(e) {
			self.calculateRayToPointer(e.offsetX, e.offsetY);
			if (self.dragObject) self.drag();
		});

		// Нажатие любой кнопки мыши: выбрать модель, если курсор находится на ней
		this.stage.renderer.domElement.addEventListener('pointerdown', function(){
			self.tryPickup();
		});
		
		// Нажатие любой кнопки мыши: если мышь выбрала какую-то модель, то информируем объект сцены об этом.
		// Этот слушатель переедет в другое место, скорее всего, в контроллер.
		this.stage.renderer.domElement.addEventListener('pointerdown', function(){
			// self.stage.scene.add(new THREE.ArrowHelper(self.stage.raycaster.ray.direction, self.stage.raycaster.ray.origin, 100, 0xff0000) );
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
	/**
		Убирает блокировку оси перемещения.
	*/
	resetLocks() {
		this.lockX = false; this.lockY = false; this.lockZ = false;
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
	
	/**
		Начать перемещение модели
	*/
	pickup(intersectionPoint, obj) {
		this.stage.controls.enabled = false;
		this.dragObject = obj;
		this.pIntersect.copy(intersectionPoint);
		
		this.planeDrag.setFromNormalAndCoplanarPoint(this.pNormal, this.pIntersect);
		
		
		this.shift.subVectors(obj.position, intersectionPoint);
	}
	/**
		Прекратить перемещение модели
	*/
	drop() {
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
		let x = this.dragObject.position.x;
		let y = this.dragObject.position.y;
		let z = this.dragObject.position.z;
		this.dragObject.position.addVectors(this.planeIntersect, this.shift);
		this.applyAxisLock(x,y,z);
		// this.applyRestraint(this.dragObject);
		// this.applyCollision(this.dragObject);
		
		if(this.dragObject.userData.onMove) this.dragObject.userData.onMove(oldpos, this.dragObject.position);
	}
	
	/**
		Ограничить перемещение модели в случае, если включена блокировка какой-то из осей.
	*/
	applyAxisLock(x,y,z) {
		if (this.lockX) {
			this.dragObject.position.y = y;
			this.dragObject.position.z = z;
		} else if (this.lockY) {
			this.dragObject.position.x = x;
			this.dragObject.position.z = z;
		} else if (this.lockZ) {
			this.dragObject.position.y = y;
			this.dragObject.position.x = x;
		}
	}
	
	/**
		Применить ограничение на перемещение модели, в случае если коллизии активированы и в объекте модели эти коллизии прописаны.
		Если какая-то из сторон куба вышла за пределы ограничителя, то позиция корректируется так, чтобы вернуть модель обратно внутрь ограничителя.
	*/
	applyRestraint(obj) {
		if (!this.collision) return;
		let restraint = obj.userData.restraint;
		if(restraint)
			obj.position.clamp( restraint.min,restraint.max );
	}
	
	/*
		Применить коллизию: если перемещаемая модель столкнулась с другой моделью, у которой есть коллизия, то пересчитываем позицию перемещаемой модели так, чтобы коллизионные коробки двух моделей не пересекались.
	**/
	applyCollision(obj) {
		if (!this.collision) return;
		
		// вынимаем линии из потомков объекта, чтобы они не учавствовали в коллизии
		let tempchild1 = [];
		let chiCopy1 = [...obj.children];
		for (let c of chiCopy1) {
			if (c.isLine || c.userData.isText) {
				tempchild1.push(c);
				obj.remove(c);
			}
		}
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

			if (this.hasIntersection(obj, colobj)) {
				let prevpos = obj.position.clone();
				let colbbox = colobj.isBox3 ? colobj : new THREE.Box3().setFromObject(colobj);
				obj.position.clamp(colbbox.min, colbbox.max);
				
				// let con_help1 = new THREE.Box3Helper(colbbox, "blue");
				// this.stage.scene.add(con_help1);
				
				/*	
					после применения dragObject.position.clamp, центр таскаемого объекта встаёт 
					на одну из граней того объекта, с котором приозошла коллизия (коллизионный объект).
					"код" ниже выталкивает таскаемый объект за пределы коллизионного объекта
				
					Схема: линии это границы таскаемого объекта, единицы - границы коллизионного.
					После клемпа			После портянки ниже
						11111111					11111111
					|---1---|  1			|-------1	   1
					|	1   |  1     =>		|		1	   1
					|___11111111			|_______11111111
				*/
				
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
				if(prevpos.y < dragpos.y) {
					dragpos.y -= halfHeight;
				} else if (prevpos.y > dragpos.y) {
					dragpos.y += halfHeight;
				}
				
			}
			for (let c of tempchild2) {
				colobj.add(c);
			}
		}
		for (let c of tempchild1) {
			obj.add(c);
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
	hasIntersection(obj1, obj2) {		
		let colbox1 = new THREE.Box3();
		let colbox2 = new THREE.Box3();
		
		colbox1 = obj1.isBox3 ? obj1 : colbox1.setFromObject(obj1);
		colbox2 = obj2.isBox3 ? obj2 : colbox2.setFromObject(obj2);

		return colbox1.intersectsBox(colbox2);
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
}