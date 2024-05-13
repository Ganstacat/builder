import * as THREE from 'three';

export class RestrainedMesh extends THREE.Mesh {
	setScale(x,y,z) {
		
		this.scale.set(x, y, z);
		this.adjustRestraintForScale();
	}
	
	adjustRestraintForScale() {
		if(!this.userData.baserestraint) return;
		console.log(this.userData.baserestraint);
		
		let dragbbox = new THREE.Box3().setFromObject(this);
		let halfLength = (dragbbox.max.x - dragbbox.min.x)/2;
		let halfHeight = (dragbbox.max.y - dragbbox.min.y)/2;
		let halfWidth  = (dragbbox.max.z - dragbbox.min.z)/2;

		this.userData.restraint = new THREE.Box3(
			new THREE.Vector3(this.userData.baserestraint.min.x+(halfLength),
							  this.userData.baserestraint.min.y+(halfHeight),
							  this.userData.baserestraint.min.z+(halfWidth)),
			new THREE.Vector3(this.userData.baserestraint.max.x-(halfLength),
							  this.userData.baserestraint.max.y-(halfHeight),
							  this.userData.baserestraint.max.z-(halfWidth))
		)
	}

	setRestraint(restraint) {
		this.userData.baserestraint = restraint;
		this.adjustRestraintForScale();
	}
}