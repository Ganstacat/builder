import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {MeshFactory} from './MeshFactory.js';

export class Stage {
	constructor() {
		this.renderer = this.setupRenderer();
		this.scene = this.setupScene();
		this.camera = this.setupCamera();
		this.controls = this.setupOrbitControls(this.camera, this.renderer);
		this.lights = this.setupLights(this.scene);
		this.raycaster = this.setupRaycaster();
		
		this.renderer.setAnimationLoop( ()=>{
			this.renderer.render(this.scene, this.camera);
		});
		this.movableObjects = [];
		this.objectsWithCollision = [];
		
		this.meshFactory = new MeshFactory(this);
		this.addStartingObjects();
		this.addEventListeners();
	}
	setupRenderer() {
		const renderer = new THREE.WebGLRenderer({antialias:true});
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		renderer.setClearColor(0x333333);
		renderer.shadowMap.enabled = true;
		return renderer;
	}
	setupScene() {
		return new THREE.Scene();
	}
	setupCamera() {
		const camera = new THREE.PerspectiveCamera(
			60, window.innerWidth / window.innerHeight,
			0.1, 1000
		);
		camera.position.set(0,3,3);

		return camera;
	}
	setupOrbitControls(camera, renderer) {
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.update();
		return controls;
	}
	setupLights(scene) {
		const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
		scene.add(ambientLight);
		const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 4);
		scene.add(directionalLight);
		directionalLight.position.set(0,3,0);
		directionalLight.castShadow = true;
		
		return [directionalLight];
	}
	setupRaycaster(){
		return new THREE.Raycaster();
	}
	
	
	hideScene() {
		this.renderer.domElement.remove();
	}
	showScene() {
		document.body.appendChild(this.renderer.domElement);
	}
	
	addStartingObjects() {
		// для переопределения
		const gridHelper = new THREE.GridHelper(4, 16);
		this.scene.add(gridHelper);
		this.constraintBox = new THREE.Box3(
			new THREE.Vector3(-1.5, 0,-2),
			new THREE.Vector3( 1.5, 1.5, 2)
		);
		const helperbox = new THREE.Box3Helper(this.constraintBox, "orange");
		this.scene.add(helperbox);
		// const box = this.meshFactory.createRestrainedMesh(
			// new THREE.BoxGeometry(0.5,0.5,0.5),
			// new THREE.MeshStandardMaterial(),
			// true, true, this.constraintBox
		// );
		// box.position.y -= box.geometry.boundingBox.min.y;
	}
	addEventListeners(){
		let self = this;
		window.addEventListener('resize', function(){
			self.camera.aspect = window.innerWidth / window.innerHeight;
			self.camera.updateProjectionMatrix();
			self.renderer.setSize(window.innerWidth, window.innerHeight);
		});
	}
	addObject(obj, isMovable, hasCollision) {
		this.scene.add(obj);
		if(isMovable) this.movableObjects.push(obj);
		if(hasCollision) this.objectsWithCollision.push(obj);
	}
}
