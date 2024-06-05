import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import {GuiManager} from './GuiManager.js';
import * as utils from './utils.js';
import {addListenersToPackableObject, addNewBox3Tree, addListenersToContainerObject} from './packableObjectListeners.js';
import {BoxesTree} from './BoxesTree.js';

/**
	Класс, производящий инициализацию сцены, хранящий её состояние и имеющий методы для манипуляции над сценой.
*/
export class Stage {
	/**
		Инициализация объекта сцены в конструкторе с помощью методов этого класса.
	*/
	constructor(controller, canvas) {
		this.controller = controller;

		this.canvas = canvas;
		this.renderer = this.setupRenderer(this.canvas);
		this.scene = this.setupScene();
		this.height = 1.8;
		this.crouchHeight = 0.8;
		
		this.camera;
		this.camera3P = this.setup3PCamera();
		this.cameraOrtho = this.setupOrthoCamera();
		this.camera1P = this.setup1PCamera();
		
		this.controls;
		this.controls3P = this.setupOrbitControls(this.camera3P, this.renderer, false);
		this.controlsOrtho = this.setupOrbitControls(this.cameraOrtho, this.renderer, true);
		this.controls1P = this.setupPointerLockControls(this.camera1P);
		
		this.lights = this.setupLights(this.scene);
		this.raycaster = this.setupRaycaster();
		
		// инициализация массивов, хранящих перемещаемые модели (группы моделей) и модели с коллизией
		this.movableObjects = [];
		this.objectsWithCollision = [];
		
		this.box3s = [];
		this.slices = [];

		// включается рендер сцены
		// this.animateOrtho();
		this.animate3P();
		
		this.guiManager = new GuiManager(this);
		this.selectedObject = null;
		
		this.addStartingObjects();
		this.addEventListeners();
	}
	
	addBox3(box, withHelper){
		this.box3s.push(box);

		if (withHelper){
			const helper = new THREE.Box3Helper(box, 0xFFFFFF-this.box3s.length * 50);
			this.scene.add(helper);
			box.helper = helper;
		}
		return box;
	}
	clearBox3s(){
		for(let b of this.box3s){
			if(b.helper) this.scene.remove(b.helper);
		}
		this.box3s = [];
	}
	removeBox3(box){
		console.log(this.box3s);
		const lBefore = this.box3s.length;
		this.box3s = this.box3s.filter((o)=>{return !utils.box3sAreSame(o,box)});
		const lAfter = this.box3s.length;
		if(lBefore === lAfter) {
			console.log('Not deleted!');
			console.log(box);
			console.log(this.box3s);
		}

		if(box.helper)
			this.scene.remove(box.helper)
	}
	/**
		Инициализурет камеру, из которой пользователь наблюдает за сценой.
	*/
	setup3PCamera() {
		const camera = new THREE.PerspectiveCamera(
			60, window.innerWidth / window.innerHeight,
			0.1, 1000
		);
		camera.position.set(0,3,3);
		camera.name = '3P';
		return camera;
	}
	setupOrthoCamera(){
		let SCREEN_WIDTH = window.innerWidth;
		let SCREEN_HEIGHT = window.innerHeight;
		let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
		this.frustumSize = 5;

		const camera = new THREE.OrthographicCamera (
			 this.frustumSize * aspect / - 2, // left
			 this.frustumSize * aspect / 2, // right
			 this.frustumSize / 2, // top
			 this.frustumSize /-2 , // bottom
			 0.1, 1000 
		);
		camera.position.set(0,10,0);
		camera.rotation.set(0,0,0);
		camera.lookAt(0,0,0);
		
		let cameraOrthoHelper = new THREE.CameraHelper( camera );
		camera.name = 'Ortho';
		return camera;
	}
	
	setup1PCamera(){
		let camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 0.1,1000);
		camera.position.y = this.height;
		camera.name = '1P';
		return camera;
	}

	setupPointerLockControls(camera){
		const controls = new PointerLockControls(camera, document.body);
		this.raycaster1P = new THREE.Raycaster(
			new THREE.Vector3(),
			new THREE.Vector3(0,-1,0),
			0,10
		);;
		
		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;
		this.canJump = false;
		this.crouching = false;
		
		this.prevTime = performance.now();
		
		this.velocity = new THREE.Vector3();
		this.direction = new THREE.Vector3();
		
		this.scene.add ( controls.getObject() );
		
		return controls;
	}
	
	animate1P() {
		this.camera = this.camera1P;	
		this.controls = this.controls1P;
	
		
		this.renderer.setAnimationLoop(()=>{
			this.animateAll();
			const time = performance.now();
			let height;
			if(this.crouching) height = this.crouchHeight;
			else height = this.height;
			
			if (this.controls1P.isLocked === true) {
				this.raycaster1P.ray.origin.copy ( this.controls1P.getObject().position );
				this.raycaster1P.ray.origin.y -= height;
				
				const intersections = this.raycaster1P.intersectObjects( this.movableObjects, false );
				const onObject = intersections.length > 0;
				
				const delta = (time - this.prevTime) / 1000;
				
				this.velocity.x -= this.velocity.x * 10.0 * delta;
				this.velocity.z -= this.velocity.z * 10.0 * delta;
				
				this.velocity.y -= 9.8 * delta;
				
				this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
				this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
				this.direction.normalize();
				
				if (this.moveForward || this.moveBackward)
					this.velocity.z -= this.direction.z * 40.0 * delta;
				if (this.moveLeft || this.moveRight)
					this.velocity.x -= this.direction.x * 40.0 * delta;
				if (onObject) {
					this.velocity.y = Math.max(0,this.velocity.y);
					this.canJump = true;
				}
				
				this.controls1P.moveRight(-this.velocity.x * delta);
				this.controls1P.moveForward(-this.velocity.z * delta);
				
				this.controls1P.getObject().position.y += (this.velocity.y * delta);
				
				if (this.controls1P.getObject().position.y < height) {
					this.velocity.y = 0;
					this.controls1P.getObject().position.y = height;
					this.canJump = true;
				}
				
			}
			this.prevTime = time;
			this.renderer.render(this.scene, this.camera1P);
		});
	}
	
	animate3P() {
		this.camera = this.camera3P;
		this.controls = this.controls3P;
		this.renderer.setAnimationLoop( ()=>{
			this.animateAll();
			this.renderer.render(this.scene, this.camera3P);
		});
	}
	
	animateOrtho() {
		this.camera = this.cameraOrtho;
		this.controls = this.controlsOrtho;

		this.renderer.setAnimationLoop( ()=>{
			this.animateAll();
			this.renderer.render(this.scene, this.cameraOrtho);
		});
	}

	animateAll(){
		for (let obj of this.movableObjects) {
			
			utils.applyToMeshes(obj, (o)=>{
				o.updateMatrix();
				o.updateMatrixWorld();
				o.userData.obb.copy(o.geometry.userData.obb);
				o.userData.obb.applyMatrix4(o.matrixWorld);
			})
		}
	}
	/**
		Инициализация THREE.WebGLRenderer, объект из библиотеки, отвечающий за отрисовку всей графики на элементе canvas.
	*/
	setupRenderer() {
		let renderer;
		if (this.canvas) {
			renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas});
		} else {
			renderer = new THREE.WebGLRenderer({antialias: true});
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(renderer.domElement);
		}
		renderer.setClearColor(0x333333);
		renderer.shadowMap.enabled = true;
		renderer.sortObjects = false
		return renderer;
	}
	/**
		Инициализация объекта THREE.Scene, что содержит в себе все объекты на сцене.
	*/
	setupScene() {
		return new THREE.Scene();
	}

	/**
		Инициализирует объект класса OrbitControls из библиотеки, позволяет пользователю управлять камерой с помощью мыши и клавиатуры. 
	*/
	setupOrbitControls(camera, renderer, restrictRotation) {
		const controls = new OrbitControls(camera, renderer.domElement);
		
		controls.enableRotate = !restrictRotation;
		controls.maxPolarAngle = Math.PI/2;
		controls.update();
		return controls;
	}
	/**
		Устанавливает освещение для сцены.
	*/
	setupLights(scene) {
		const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
		scene.add(ambientLight);
		const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 4);
		scene.add(directionalLight);
		directionalLight.position.set(0,3,0);
		directionalLight.castShadow = true;
		
		return [directionalLight];
	}
	/**
		Инициализирует объект класса THREE.Raycaster, который предназначен для помощи в рейкастинге. Raycasting используется, среди прочего, для выбора мышью (определения того, над какими объектами в трехмерном пространстве находится мышь).
		^ перевод гуглтранслитом из документации Three.js
	*/
	setupRaycaster(){
		return new THREE.Raycaster();
	}
	
	/**
		Скрывает текущую сцену, отсоединяя канвас рендера от документа.
		Так же скрывается интерфейс dat.GUI
	*/
	hideScene() {
		this.renderer.domElement.remove();
		this.guiManager.hide();
	}
	/**
		Показывает текущую сцену, присоединяя канвас рендера к документу.
		Так же показывается интерфейс dat.GUI
	*/
	showScene() {
		document.body.appendChild(this.renderer.domElement);
		if(this.selectedObject) this.guiManager.show();
	}
	
	/**
		Определить обеъкты, которыу будут добавлены после инициализации сцены.
	*/
	addStartingObjects() {
		// для переопределения
		const gridHelper = new THREE.GridHelper(16, 64);
		this.scene.add(gridHelper);
		// this.constraintBox = new THREE.Box3(
			// new THREE.Vector3(-1.5, 0,-2),
			// new THREE.Vector3( 1.5, 1.5, 2)
		// );
		const box3 = this.addBox3(new THREE.Box3(
			new THREE.Vector3(-1.5, 0, -2),
			new THREE.Vector3(1.5, 1.5, 2)
		), true);
		
		const box4 = this.addBox3(new THREE.Box3(
			new THREE.Vector3(-4.5, 0, -2),
			new THREE.Vector3(-3.5, 2, 1)
		), true);
		
		addNewBox3Tree(box3);
		addNewBox3Tree(box4);

		const box = utils.createMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial()
		);
		const box_cop = utils.createMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial()
		);
		// box.position.y -= box.geometry.boundingBox.min.y;
		box.position.x -= 0;
		box_cop.position.x -= 1;
		
		
		const box2 = utils.createMesh(
			new THREE.BoxGeometry(1,0.2,0.5),
			new THREE.MeshStandardMaterial(),
			this.constraintBox
		);

		const box2_cop = utils.createMesh(
			new THREE.BoxGeometry(0.5,0.2,0.5),
			new THREE.MeshStandardMaterial(),
			this.constraintBox
		);
		// box2.position.y -= box.geometry.boundingBox.min.y;
		box2.position.x += 1;
		box2_cop.position.x += 2;
		

			
		// box.userData.lockScale = 'x'
		// box_cop.userData.lockScale = 'x'
		// box2.userData.lockScale = 'y'
		// box2_cop.userData.lockScale = 'y'
		this.addObject(box,true,false,true,false);
		this.addObject(box_cop,true,true,true,false);
		// this.addObject(box2,true,true,true,true);
		// this.addObject(box2_cop,true,true,true,true);
		// addListenersToContainerObject(box, this.controller.dragEngine, box3);
		// this.setRestraint(box, box3);
		// this.setRestraint(box2, this.constraintBox);
		

		// utils.moveBox3(box3, new THREE.Vector3(1,0,2));
	}

	/**
		Добавляет слушатели событий, необходимые для работы этого класса
	*/
	addEventListeners(){
		let self = this;
		// Обновляет размер холста при изменении размеров окна браузера.
		window.addEventListener('resize', function(){
			let aspect = window.innerWidth / window.innerHeight;
			
			self.camera.aspect = aspect;
			self.camera.updateProjectionMatrix();
			self.renderer.setSize(window.innerWidth, window.innerHeight);
			
			self.camera1P.aspect = aspect;
			self.camera1P.updateProjectionMatrix();
			
			self.cameraOrtho.left =  self.frustumSize * aspect /-2;
			self.cameraOrtho.right =  self.frustumSize * aspect /2;
			self.cameraOrtho.updateProjectionMatrix();
		});
		
		// управление для первого лица, потом вынести в кб контролз, наверное
		const onKeyDown = function (event) {
			switch (event.code) {
				case 'KeyB':
					self.crouching = true;
					self.velocity.y -= 6;
					break;
				case 'Digit1':
					self.switchTo1PCamera();
					break;
				case 'Digit2':
					self.switchTo3PCamera();
					break;
				case 'Digit3':
					self.switchToOrthoCamera();
					break;
				case 'KeyW': self.moveForward = true; break;
				case 'KeyA': self.moveLeft = true; break;
				case 'KeyD': self.moveRight = true; break;
				case 'KeyS': self.moveBackward = true; break;
				case 'Space':
					if (self.canJump === true) self.velocity.y += 3.5;
					self.canJump = false;
					break;
			}
		};
		const onKeyUp = function (event) {
			switch (event.code) {
				case 'KeyB':
					self.crouching = false;
					// self.height = 1.8;
					break;
				case 'KeyW': self.moveForward = false; break;
				case 'KeyA': self.moveLeft = false; break;
				case 'KeyD': self.moveRight = false; break;
				case 'KeyS': self.moveBackward = false; break;
			}
		};
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);
	}
	switchToOrthoCamera(){
		this.controls1P.unlock();
		this.velocity.set(0,0,0);
		this.animateOrtho();
		this.currentCamera = 'Ortho';
	}
	switchTo3PCamera(){
		this.controls1P.unlock();
		this.velocity.set(0,0,0);
		this.animate3P();
		this.currentCamera = '3P'
	}
	switchTo1PCamera(){
		this.controls1P.lock();
		this.velocity.set(0,0,0);
		this.animate1P();
		this.currentCamera = '1P'
	}

	/**
		Добавляет модель или группу моделей на сцену.
	*/
	addObject(obj, isMovable, hasCollision, hasDimensions, isPackable) {
		if(isMovable) {this.movableObjects.push(obj);}
		if(hasCollision) {
			utils.applyToMeshes(obj, (o)=>{
				o.userData.isWall = obj.userData.isWall;
				this.objectsWithCollision.push(o);
			});
		}
		
		obj.userData.isMovable = isMovable;
		obj.userData.hasCollision = hasCollision;
		if (hasDimensions) {
			this.controller.addLabelToObject(obj);
			obj.userData.hasDimensions = true;
		}
		if (isPackable) {
			addListenersToPackableObject(obj, this.controller.dragEngine);
		}

		this.scene.add(obj);
		
	}

	/**
		Не используется. 
		Назначение - установить позицию модели по высоте на значение "0 + высота", чтобы модель встала "на пол".
	*/
	// placeObjectOnPlane(obj) {
	// 	const box3 = new THREE.Box3().setFromObject(obj);
	// 	let halfHeight = (box3.max.y - box3.min.y)/2;
	// 	obj.position.y = halfHeight;
	// }

	/**
		Изменить размер модели
	*/
	setScale(obj,x,y,z){
		if(!obj) return;
		
		if(obj.userData.hasDimensions) this.controller.removeLabelFromObject(obj);

		const model = utils.getModelsGroup(obj);
		model.scale.set(x,y,z);
		if(obj.userData.isRestrained) this.adjustRestraintForScale(obj);

		if(obj.userData.hasDimensions) this.controller.addLabelToObject(obj);
		this.onObjectUpdate();
	}
	scaleObjToBox3(obj,box3){
		const b3size = utils.getBox3Size(box3);
		const model = utils.getModelsGroup(obj);
		if(model.userData.scaled) return;

		model.userData.origScale = model.scale.clone();
		model.userData.scaleBox = box3;
		model.userData.scaled = true;
		
		this.setScale(obj,1,1,1);
		const modelSize = utils.getBox3Size(new THREE.Box3().setFromObject(model));
		
		const scales = new THREE.Vector3(
			b3size.x / modelSize.x,
			b3size.y / modelSize.y,
			b3size.z / modelSize.z
		);
		
		if (obj.userData.lockScale === 'x') {
			scales.x = model.userData.origScale.x;
		} else if (obj.userData.lockScale === 'y') {
			scales.y = model.userData.origScale.y;
		}
		
		this.setScale(obj, scales.x, scales.y, scales.z);
	}
	returnObjOriginalScale(obj){
		const model = utils.getModelsGroup(obj);
		if(!model.userData.scaled) return;
		model.userData.scaled = false;
		model.userData.scaleBox = null;
		
		const os = model.userData.origScale;
		this.setScale(obj, os.x, os.y, os.z);
		this.removeRestraint(obj);
		
	}
	// findBoxes3AdjacentToSlice(slice){
	// 	const boxes = [];
	// 	for (let b of this.box3s) {
	// 		if(b.intersectsBox(slice)) {
	// 			boxes.push(b);
	// 		}
	// 	}
	// 	return boxes;
	// }
	// findSlicesInsideBox(box){
	// 	const slices = [];
	// 	let center = new THREE.Vector3();
	// 	for (let s of this.slices){
	// 		if(utils.sliceRestsAgainstBox(box, s)) continue;

	// 		s.getCenter(center);
	// 		if(box.containsPoint(center)){
	// 			slices.push(s);
	// 			// console.log(center);
	// 			const arrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), center, 1);
	// 			this.scene.add(arrow);
	// 		}
	// 	}
	// 	return slices;
	// }
	addSlice(slice){
		this.slices.push(slice);
	}
	removeSlice(slice){
		this.slices = this.slices.filter((o)=>{return !utils.box3sAreSame(o,slice)});
	}
	
	scaleObjectAxisScalar(obj, axis, amount){
		if(!obj) return;
		const model = utils.getModelsGroup(obj);
		
		const scale = model.scale;
		scale[axis] += amount;
		this.setScale(obj, scale.x, scale.y, scale.z);

	}
	/**
		Установить поворт модели*
	*/
	setRotation(obj,x,y,z){
		if(!obj) return;
		obj.rotation.set(x,y,z);
		this.onObjectUpdate();
		
		// const self = this;
		// utils.applyToMeshes(obj, (o)=>{
			// const points = utils.getOBBPoints(o.userData.obb)
			// console.log(utils.getOBBPoints(o.userData.obb));
			
			// const dir = new THREE.Vector3(0,1,0);
			// const length = 1;
			// const hex = 0xffff00;
			
			
			// if (this.arrows)
				// for (let a of this.arrows)
					// this.scene.remove(a);
				
			// this.arrows = [];
			// for (let p of points){
				// const ah = new THREE.ArrowHelper(dir, p, length, hex);
				// this.scene.add(ah);
				// this.arrows.push(ah);
			// }
		// });
	}
	/**
		Установить цвет модели
	*/
	setMeshColor(obj, val){
		if(!obj) return;
		utils.applyToMeshes(
			obj,
			(o, args)=>{
				utils.applyToArrayOrValue(o.material, (o, a)=>{
					o.color.set(a[0]);
				}, args);
			},
			[val]
		);
		this.onObjectUpdate();
	}
	moveObject(obj, axis, amount){
		obj.position[axis] += amount;
		this.onObjectUpdate();
	}
	getSelectedObject(){
		return this.selectedObject;
	}
	/**
		Уставновить модель как выбранную.
	*/
	setSelectedObject(obj) {
		if(this.selectedObject) this.removeSelectionColor(this.selectedObject);
		this.selectedObject = obj;
		this.applySelectionColor(this.selectedObject);
		this.guiManager.show();
		this.guiManager.updateGui();
	}
	/**
		Отменить выделение модели
	*/
	unsetSelectedObject() {
		if(this.selectedObject) this.removeSelectionColor(this.selectedObject);
		this.guiManager.hide();
		this.selectedObject = null;
	}
	
	/**
		Убрать оранжевую подсветку у модели.
	*/
	removeSelectionColor(obj) {
		if (!obj) return;
		utils.applyToMeshes(obj,
			(o)=>{
				utils.applyToArrayOrValue(o.material,(m)=>{
					m.emissive.set(0)
				});
			}
		);
	}
	/**
		Включить оранжевую подсветку у модели
	*/
	applySelectionColor(obj){
		utils.applyToMeshes(obj,
			(o)=>{
				utils.applyToArrayOrValue(o.material,(m)=>{
					m.emissive.set(0x9c8e30)
				});
			}
		);
	}

	
	/**
		Убрать объект со сцены
	*/
	removeObject(obj) {
		this.scene.remove(obj);
		this.movableObjects = this.movableObjects.filter((o)=>{return o !== obj});
		this.objectsWithCollision = this.objectsWithCollision.filter((o)=>{return o !== obj});
	}
	
	/**
		Отчистить сцену от всех movable объектов.
	*/
	clearScene() {
		for(let obj of this.movableObjects){
			this.scene.remove(obj);
		}
		this.movableObjects = [];
		this.objectsWithCollision = [];
	}
	
	/**
		Обновить размеры ограничительного куба в зависимости от размера модели.
	*/
	adjustRestraintForScale(obj) {
		if(!obj.userData.baserestraint) return;
		
		let dragbbox = new THREE.Box3().setFromObject(obj);
		let halfLength = (dragbbox.max.x - dragbbox.min.x)/2;
		let halfHeight = (dragbbox.max.y - dragbbox.min.y)/2;
		let halfWidth  = (dragbbox.max.z - dragbbox.min.z)/2;

		obj.userData.restraint = new THREE.Box3(
			new THREE.Vector3(obj.userData.baserestraint.min.x+(halfLength),
							  obj.userData.baserestraint.min.y+(halfHeight),
							  obj.userData.baserestraint.min.z+(halfWidth)),
			new THREE.Vector3(obj.userData.baserestraint.max.x-(halfLength),
							  obj.userData.baserestraint.max.y-(halfHeight),
							  obj.userData.baserestraint.max.z-(halfWidth))
		)
	}
	/**
		Установить ограничение для модели.
	*/
	setRestraint(obj, box3) {
		obj.userData.baserestraint = box3;
		obj.userData.isRestrained = true;
		this.adjustRestraintForScale(obj);
	}
	removeRestraint(obj){
		obj.userData.baserestraint = null;
		obj.userData.restraint = null;
		obj.userData.isRestrained = false;
		
	}

	
	onObjectUpdate(obj){
		this.guiManager.updateGui();
	}
	
	getRaycaster(){
		return this.raycaster;
	}
}
