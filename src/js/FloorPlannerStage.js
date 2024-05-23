import * as THREE from 'three';
import  {Stage} from './Stage.js';

/**
	Потомок класса Stage, отличается набором моделей, присутствующих на сцене после инициализации.
*/
export class FloorPlannerStage extends Stage {	
	setCanvas() {
		// this.canvas = document.querySelector('#floorPlanner');
	}
	addStartingObjects() {
		const gridHelper = new THREE.GridHelper(16, 64);
		this.scene.add(gridHelper);
		const plane = this.meshFactory.createMesh(
			new THREE.PlaneGeometry(4,4),
			new THREE.MeshStandardMaterial({color: 0x999999, side: THREE.DoubleSide})
		);
		plane.rotation.x = -0.5 * Math.PI;
		plane.receiveShadow = true;

		const wallColor = 0xf8c471;
		const textureLoader = new THREE.TextureLoader();
		
		const wallGeometry = new THREE.PlaneGeometry(4,4);
		const walltexture = textureLoader.load('./assets/textures/wallpaper2.jpg');
		walltexture.wrapS = THREE.RepeatWrapping;
		walltexture.wrapT = THREE.RepeatWrapping;
		walltexture.repeat.set(4,4);
		const wallMaterial = ()=>{return new THREE.MeshStandardMaterial( {
			map: walltexture
		});}

		const wall1 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial()
		)
		const wall2 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial()
		)	
		const wall3 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial()
		)
		const wall4 = this.meshFactory.createMesh(
			wallGeometry,
			wallMaterial()
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
		
		wall1.userData.isSelectable = true;
		wall2.userData.isSelectable = true;
		wall3.userData.isSelectable = true;
		wall4.userData.isSelectable = true;
		plane.userData.isSelectable = true;
		
		
		this.addObject(wall1,false,true);
		this.addObject(wall2,false,true);
		this.addObject(wall3,false,true);
		this.addObject(wall4,false,true);
		this.addObject(plane,false,false);
		
		
		this.constraintBox = new THREE.Box3(
			new THREE.Vector3(-2, 0,-2),
			new THREE.Vector3( 2, 1.5, 2)
		);
		
		// const box = this.meshFactory.createRestrainedMesh(
			// new THREE.BoxGeometry(0.5,0.5,0.5),
			// new THREE.MeshStandardMaterial(),
			// this.constraintBox
		// );
		// box.castShadow = true;
		// const helperbox = new THREE.Box3Helper(constraintBox, "orange");
		// this.scene.add(helperbox);
		
	}
}