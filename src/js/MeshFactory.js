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
		return mesh;
	}
	
	setStage(stage) {
		this.stage = stage;
	}
}