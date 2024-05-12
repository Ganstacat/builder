import * as THREE from 'three';
import  {Stage} from './Stage.js';
import  {RestrainedMesh} from './RestrainedMesh.js';

export class MeshFactory {
	constructor(stage) {
		this.stage = stage;
	}
	createMesh(geometry, material, isMovable, hasCollision) {
		const mesh = new THREE.Mesh(geometry, material);
		this.stage.scene.add(mesh);
		mesh.geometry.computeBoundingBox();

		if (isMovable) {
			this.stage.movableObjects.push(mesh);
			mesh.userData.isMovable = true;
		}
		if (hasCollision) {
			this.stage.objectsWithCollision.push(mesh);
			mesh.userData.hasCollision = true;
		}
		return mesh;
	}
	createRestrainedMesh(geometry, material, isMovable, hasCollision, restraint) {
		const mesh = new RestrainedMesh(geometry, material);
		this.stage.scene.add(mesh);
		mesh.geometry.computeBoundingBox();
		mesh.setRestraint(restraint);
		
		if (isMovable) {
			this.stage.movableObjects.push(mesh);
			mesh.userData.isMovable = true;
		}
		if (hasCollision) {
			this.stage.objectsWithCollision.push(mesh);
			mesh.userData.hasCollision = true;
		}
		
		mesh.userData.isRestrainedMesh = true;
		return mesh;
	}
	cloneMesh(mesh) {
		let newobj;
		newobj = this.createMesh(
			mesh.geometry.clone(), mesh.material.clone(),
			mesh.userData.isMovable, mesh.userData.hasCollision
		);
		newobj.position.set(mesh.position.x,mesh.position.y,mesh.position.z);
		return newobj;
	}
	cloneRestrainedMesh(mesh){
		let newobj;
		newobj = this.createRestrainedMesh(
			mesh.geometry.clone(), mesh.material.clone(),
			mesh.userData.isMovable, mesh.userData.hasCollision, mesh.baserestraint.clone()
		);
		newobj.position.set(mesh.position.x,mesh.position.y,mesh.position.z);
		return newobj;
	}
	cloneGroup(grp){
		let newobj = new THREE.Group();
		let stage = this.stage;
		stage.applyToMeshes(stage.selectedObject, function (o){
			if(o.userData.isRestrainedMesh) newobj.add(stage.meshFactory.cloneRestrainedMesh(o));
			else if(o.isMesh) newobj.add(stage.meshFactory.cloneMesh(o));
		});
		stage.addObject(newobj, true, true);
		return newobj;
	}
	cloneObject(obj) {
		if(obj.userData.isRestrainedMesh) return this.cloneRestrainedMesh(obj);
		else if (obj.isMesh) return this.cloneMesh(obj);
		else if (obj.isGroup) return this.cloneGroup(obj);
		else throw "cannot clone object: "+ obj;
	}
	
	setStage(stage) {
		this.stage = stage;
	}
}