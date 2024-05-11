import * as THREE from 'three';

export class RestrainedMesh extends THREE.Mesh {
	setScale(x,y,z) {
		this.scale.set(x, y, z);
		this.adjustRestraintForScale();
	}
	
	adjustRestraintForScale() {
		if(!this.baserestraint) return;
		
		let dragbbox = new THREE.Box3().setFromObject(this);
		let halfLength = (dragbbox.max.x - dragbbox.min.x)/2;
		let halfHeight = (dragbbox.max.y - dragbbox.min.y)/2;
		let halfWidth  = (dragbbox.max.z - dragbbox.min.z)/2;

		this.userData.restraint = new THREE.Box3(
			new THREE.Vector3(this.baserestraint.min.x+(halfLength),
							  this.baserestraint.min.y+(halfHeight),
							  this.baserestraint.min.z+(halfWidth)),
			new THREE.Vector3(this.baserestraint.max.x-(halfLength),
							  this.baserestraint.max.y-(halfHeight),
							  this.baserestraint.max.z-(halfWidth))
		)
	}

	setRestraint(restraint) {
		this.baserestraint = restraint;
		this.adjustRestraintForScale();
	}
}