import * as THREE from 'three';
import  {Stage} from './Stage.js';

export class FloorPlannerStage extends Stage {	
	addStartingObjects() {
		const plane = this.meshFactory.createMesh(
			new THREE.PlaneGeometry(4,4),
			new THREE.MeshStandardMaterial({color: 0x999999, side: THREE.DoubleSide}),
			false, true
		);
		plane.rotation.x = -0.5 * Math.PI;
		plane.receiveShadow = true;

		const wallColor = 0xf8c471;
		const textureLoader = new THREE.TextureLoader();
		
		const wallGeometry = new THREE.PlaneGeometry(1.5,4);
		const walltexture = textureLoader.load('./assets/textures/wallpaper2.jpg');
		walltexture.wrapS = THREE.RepeatWrapping;
		walltexture.wrapT = THREE.RepeatWrapping;
		walltexture.repeat.set(2,4);
		const wallMaterial = new THREE.MeshStandardMaterial( {
			map: walltexture
		});

		const wall1 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial,
			false, false
		)
		const wall2 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial,
			false, false
		)	
		const wall3 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial,
			false, false
		)
		const wall4 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial,
			false, false
		)
		
		wall1.rotation.y = 0.5 * Math.PI;
		wall1.rotation.z = -0.5 * Math.PI;
		wall1.position.set(-2, 0.75, 0);
		
		wall2.position.set(0,0.75,-2);
		wall2.rotation.z = 0.5 * Math.PI;
		
		wall3.position.set(2,0.75,0);
		wall3.rotation.x = 0.5 * Math.PI;
		wall3.rotation.y = -0.5 * Math.PI;
		
		wall4.position.set(0,0.75,2);
		wall4.rotation.y = -1 * Math.PI;
		wall4.rotation.z = 0.5 * Math.PI;
		
		wall1.castShadow = true;
		wall1.receiveShadow = true;
		
		
		
		this.constraintBox = new THREE.Box3(
			new THREE.Vector3(-2, 0,-2),
			new THREE.Vector3( 2, 1.5, 2)
		);
		
		// const box = this.meshFactory.createRestrainedMesh(
			// new THREE.BoxGeometry(0.5,0.5,0.5),
			// new THREE.MeshStandardMaterial(),
			// true, true, this.constraintBox
		// );
		// box.castShadow = true;
		// const helperbox = new THREE.Box3Helper(constraintBox, "orange");
		// this.scene.add(helperbox);
		
	}
}