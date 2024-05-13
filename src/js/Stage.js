import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {MeshFactory} from './MeshFactory.js';
import {GuiManager} from './GuiManager.js';

export class Stage {
	constructor() {
		this.setCanvas();
		this.renderer = this.setupRenderer(this.canvas);
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
		
		this.guiManager = new GuiManager(this);
		this.meshFactory = new MeshFactory(this);
		this.selectedObject = null;
		
		this.addStartingObjects();
		this.addEventListeners();
	}
	
	setCanvas(){
		// Для переопределения
		// this.canvas = document.querySelector('#builder');
	}
	setupRenderer() {
		let renderer;
		if (this.canvas) {
			renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas });
		} else {
			renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(renderer.domElement);
		}
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
		this.guiManager.hide();
	}
	showScene() {
		document.body.appendChild(this.renderer.domElement);
		this.guiManager.show();
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
		// obj.position.set(0,0,0);
		// const box = new THREE.BoxHelper( obj, 0xffff00 );
		// this.scene.add( box );
		// this.placeObjectOnPlane(obj);
	}

	placeObjectOnPlane(obj) {
		const box3 = new THREE.Box3().setFromObject(obj);
		let halfHeight = (box3.max.y - box3.min.y)/2;
		obj.position.y = halfHeight;
	}

	setScale(obj,x,y,z){
		console.log(obj);
		if(!obj) return;
		if (obj.userData.isRestrainedMesh) obj.setScale(x,y,z);
		else obj.scale.set(x,y,z);
	}
	setRotation(obj,x,y,z){
		if(!obj) return;
		obj.rotation.x = x; obj.rotation.y = y; obj.rotation.z = z;
	}
	setMeshColor(obj, val){
		if(!obj) return;
		this.applyToMeshes(
			obj,
			(o, args)=>{
				console.log("Setting color:");
				console.log(o);
				console.log(args);
				o.material.color.set(args[0]);
				console.log(o);
			},
			[val]
		);
	}
	
	setSelectedObject(obj) {
		if(this.selectedObject) this.removeSelectionColor(this.selectedObject);
		this.selectedObject = obj;
		this.applySelectionColor(this.selectedObject);
		this.guiManager.updateGui();
	}
	unsetSelectedObject() {
		if(this.selectedObject) this.removeSelectionColor(this.selectedObject);
		this.selectedObject = null;
	}
	
	removeSelectionColor(obj) {
		this.applyToMeshes(obj,
			(o)=>{o.material.emissive.set(0x000000)}
		);
	}
	applySelectionColor(obj){
		this.applyToMeshes(obj,
			(o)=>{o.material.emissive.set(0x9c8e30)}
		);
	}
	applyToMeshes(obj, cb, args) {
		
		if(obj.isMesh) {
			cb(obj, args);
		}
		else {
			for(let o of obj.children)
				this.applyToMeshes(o,cb,args);
		}
	}
	
	removeObject(obj) {
		this.scene.remove(obj);
		this.movableObjects = this.movableObjects.filter((o)=>{return o !== obj});
	}
	clearScene() {
		for(let obj of this.movableObjects){
			this.scene.remove(obj);
		}
		this.movableObjects = [];
	}
}
