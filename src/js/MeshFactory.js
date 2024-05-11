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
			mesh.userData.isMovable, mesh.userData.hasCollision, mesh.userData.restraint.clone()
		);
		newobj.position.set(mesh.position.x,mesh.position.y,mesh.position.z);
		return newobj;
	}
	
	setStage(stage) {
		this.stage = stage;
	}
}