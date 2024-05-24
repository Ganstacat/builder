import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import {GuiManager} from './GuiManager.js';
import * as utils from './utils.js';

/**
	Класс, производящий инициализацию сцены, хранящий её состояние и имеющий методы для манипуляции над сценой.
*/
export class Stage {
	/**
		Инициализация объекта сцены в конструкторе с помощью методов этого класса.
	*/
	constructor(controller) {
		this.controller = controller;
		
		this.setCanvas();
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
		
		// включается рендер сцены
		this.animateOrtho();
		
		this.guiManager = new GuiManager(this);
		this.selectedObject = null;
		
		this.addStartingObjects();
		this.addEventListeners();
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
			this.renderer.render(this.scene, this.camera3P);
		});
	}
	
	animateOrtho() {
		this.camera = this.cameraOrtho;
		this.controls = this.controlsOrtho;
		
		// эксперименты с поворотом размеров в камеру. Так себе получилось.
		// let self = this;
		// function fixOritentation(mesh) {
			// const quaternion = self.camera.quaternion;
			// mesh.setRotationFromQuaternion(quaternion);
			// mesh.updateMatrix();
		// }
		// for(let o of this.movableObjects) {
			// if (o.name === 'container') {
				// for(let c of o.children){
					// if (c.userData.isText) {
						// fixOritentation(c);
					// }
				// }
			// }
		// }
		
		
		this.renderer.setAnimationLoop( ()=>{
			this.renderer.render(this.scene, this.cameraOrtho);
		});
	}
	/**
		Вручную устанавливает элемент <canvas>, на котором будет выполняться рендер сцены.
		Нужно, если рендер будет происходить на заранее созданном canvas.
		По-моему оно пока ещё не работает, как положено, чтобы заработало надо обновить медоты show и hide
	*/
	setCanvas(){
		// Для переопределения
		// this.canvas = document.querySelector('#builder');
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
		if(restrictRotation)
			controls.maxPolarAngle = 0;
		controls.enableRotate = false;
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
		this.constraintBox = new THREE.Box3(
			new THREE.Vector3(-1.5, 0,-2),
			new THREE.Vector3( 1.5, 1.5, 2)
		);
		const helperbox = new THREE.Box3Helper(this.constraintBox, "orange");
		this.scene.add(helperbox);
		
		const box = utils.createMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial()
		);
		// box.position.y -= box.geometry.boundingBox.min.y;
		box.position.x -= 1;
		this.addObject(box,true,true,true);
		
		const box2 = utils.createMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial(),
			this.constraintBox
		);
		// box2.position.y -= box.geometry.boundingBox.min.y;
		box2.position.x += 1;
		this.addObject(box2,true,true,true);
		
		this.setRestraint(box, this.constraintBox);
		this.setRestraint(box2, this.constraintBox);
		
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
					self.controls1P.lock();
					self.velocity.set(0,0,0);
					self.animate1P();
					self.currentCamera = '1P'
					break;
				case 'Digit2':
					self.controls1P.unlock();
					self.velocity.set(0,0,0);
					self.animate3P();
					self.currentCamera = '3P'
					break;
				case 'Digit3':
					self.controls1P.unlock();
					self.velocity.set(0,0,0);
					self.animateOrtho();
					self.currentCamera = 'Ortho'
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

	/**
		Добавляет модель или группу моделей на сцену.
	*/
	addObject(obj, isMovable, hasCollision, hasDimensions) {
		if(isMovable) {this.movableObjects.push(obj);}
		if(hasCollision) {
			// this.objectsWithCollision.push(obj);
			utils.applyToMeshes(obj, (o)=>{
				this.objectsWithCollision.push(o);
			});
		}
		
		obj.userData.isMovable = isMovable;
		obj.userData.hasCollision = hasCollision;
		if (hasDimensions) this.controller.addLabelToObject(obj);
		this.scene.add(obj);
		
		// this.objectsWithCollision.push(obj);
		// obj.position.set(0,0,0);
		// const box = new THREE.BoxHelper( obj, 0xffff00 );
		// this.scene.add( box );
		// this.placeObjectOnPlane(obj);
	}

	/**
		Не используется. 
		Назначение - установить позицию модели по высоте на значение "0 + высота", чтобы модель встала "на пол".
	*/
	placeObjectOnPlane(obj) {
		const box3 = new THREE.Box3().setFromObject(obj);
		let halfHeight = (box3.max.y - box3.min.y)/2;
		obj.position.y = halfHeight;
	}

	/**
		Изменить размер модели
	*/
	setScale(obj,x,y,z){
		if(!obj) return;
		
		this.controller.removeLabelFromObject(obj);
		for(let grp of obj.children){
			if (grp.name === 'models') {
				grp.scale.set(x,y,z);
				if (obj.userData.isRestrained) {
					this.adjustRestraintForScale(obj);
				}
			}
		}
		
		this.controller.addLabelToObject(obj);
		this.onObjectUpdate();
	}
	scaleObjectAxisScalar(obj, axis, amount){
		if(!obj) return;
		
		for(let grp of obj.children)
			if(grp.name === 'models'){
				const scale = grp.scale;
				scale[axis] += amount;
				this.setScale(obj, scale.x,scale.y,scale.z);
			}
	}
	/**
		Установить поворт модели*
	*/
	setRotation(obj,x,y,z){
		if(!obj) return;
		obj.rotation.set(x,y,z);
		this.onObjectUpdate();
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
	setRestraint(obj, restraint) {
		obj.userData.baserestraint = restraint;
		obj.userData.isRestrained = true;
		this.adjustRestraintForScale(obj);
	}

	
	onObjectUpdate(obj){
		this.guiManager.updateGui();
	}
}
