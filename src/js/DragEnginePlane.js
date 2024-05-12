import * as THREE from 'three';
import  {Stage} from './Stage.js';

export class DragEnginePlane {
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
		
		this.restriction = true;
		this.collision = true;
	}
	addEventListenersToStage() {
		let self = this;
		
		this.stage.renderer.domElement.addEventListener('pointermove', function(e) {
			self.calculateRayToPointer(e.clientX, e.clientY);
			if (self.dragObject) self.drag();
		});

		
		this.stage.renderer.domElement.addEventListener('pointerdown', function(){
			self.tryPickup();
		});
		this.stage.renderer.domElement.addEventListener('pointerdown', function(){

			if(self.dragObject) {
				self.stage.setSelectedObject(self.dragObject);
			} else {
				// по сути два раза смотрим пересечения с объектами. Нот грейт.
				let obj = self.selectObject(self.stage.scene.children);
				if (obj) self.stage.setSelectedObject(obj);
			}
			
		});
		this.stage.renderer.domElement.addEventListener("pointerup", function(){
			self.drop();
		});
	

	}
	resetLocks() {
		this.lockX = false; this.lockY = false; this.lockZ = false;
	}
	
	tryPickup() {
		let intersects = this.stage.raycaster.intersectObjects(this.stage.movableObjects);
		
		if(intersects.length >0) {
			
			let obj = this.getRootParentGroup(intersects[0].object);
			let point = intersects[0].point;
			this.pickup(point, obj);
		}
	}
	selectObject(objectlist) {
		let intersects = this.stage.raycaster.intersectObjects(objectlist);
		if(intersects.length > 0 && intersects[0].object.userData.isSelectable)
			return this.getRootParentGroup(intersects[0].object);
		else
			return null;
	}
	
	pickup(intersectionPoint, obj) {
		this.stage.controls.enabled = false;
		this.dragObject = obj;
		this.pIntersect.copy(intersectionPoint);
		
		this.planeDrag.setFromNormalAndCoplanarPoint(this.pNormal, this.pIntersect);
		
		
		this.shift.subVectors(obj.position, intersectionPoint);
	}
	drop() {
		this.dragObject = null;
		this.stage.controls.enabled = true;
	}
	
	drag() {
		this.stage.raycaster.setFromCamera(this.mousePosition, this.stage.camera);
		this.stage.raycaster.ray.intersectPlane(this.planeDrag, this.planeIntersect);

		let x = this.dragObject.position.x;
		let y = this.dragObject.position.y;
		let z = this.dragObject.position.z;
		this.dragObject.position.addVectors(this.planeIntersect, this.shift);
		// this.dragObject.position.x = x;
		// this.dragObject.position.y = y;
		// this.dragObject.position.z = z;
		this.applyAxisLock(x,y,z);
		this.applyRestraint(this.dragObject);
		this.applyCollision(this.dragObject);
	}
	
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
	
	applyRestraint(obj) {
		if (!this.collision) return;
		let restraint = obj.userData.restraint;
		if(restraint)
			obj.position.clamp( restraint.min,restraint.max );
	}
	
	applyCollision(obj) {
		if (!this.collision) return;
		for(let colobj of this.stage.objectsWithCollision) {
			if (obj=== colobj) continue;
			if (this.hasIntersection(obj, colobj)) {
				let prevpos = obj.position.clone();
				let colbbox = colobj.isBox3 ? colobj : new THREE.Box3().setFromObject(colobj);
				obj.position.clamp(colbbox.min, colbbox.max);
				
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
				let dragbbox = new THREE.Box3().setFromObject(this.dragObject);
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
			
		}
	}
	
	calculateRayToPointer(pointerX, pointerY) {
		this.mousePosition.x = (pointerX / window.innerWidth) * 2 - 1;
		this.mousePosition.y = - (pointerY / window.innerHeight) * 2 + 1;
		this.stage.raycaster.setFromCamera(this.mousePosition, this.stage.camera);
	}
	
	hasIntersection(obj1, obj2) {
		
		let colbox1 = new THREE.Box3();
		let colbox2 = new THREE.Box3();
		
		colbox1 = obj1.isBox3 ? obj1 : colbox1.setFromObject(obj1);
		colbox2 = obj2.isBox3 ? obj2 : colbox2.setFromObject(obj2);
		return colbox1.intersectsBox(colbox2);
	}

	getRootParentGroup(obj) {
		let objParent = obj;
		while (objParent.parent && !objParent.parent.isScene) {
			objParent = objParent.parent;
		}
		return objParent;
	}

	setStage(stage) {
		this.stage = stage;
	}
}