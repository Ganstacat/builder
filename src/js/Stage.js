import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {MeshFactory} from './MeshFactory.js';
import {GuiManager} from './GuiManager.js';

/**
	Класс, производящий инициализацию сцены, хранящий её состояние и имеющий методы для манипуляции над сценой.
*/
export class Stage {
	/**
		Инициализация объекта сцены в конструкторе с помощью методов этого класса.
	*/
	constructor() {
		this.setCanvas();
		this.renderer = this.setupRenderer(this.canvas);
		this.scene = this.setupScene();
		this.camera = this.setupCamera();
		this.controls = this.setupOrbitControls(this.camera, this.renderer);
		this.lights = this.setupLights(this.scene);
		this.raycaster = this.setupRaycaster();
		
		
		// включается рендер сцены
		this.renderer.setAnimationLoop( ()=>{
			this.renderer.render(this.scene, this.camera);
		});
		
		// инициализация массивов, хранящих перемещаемые модели (группы моделей) и модели с коллизией
		this.movableObjects = [];
		this.objectsWithCollision = [];
		
		// meshFactory желательно отсюда выкинуть
		this.guiManager = new GuiManager(this);
		this.meshFactory = new MeshFactory(this);
		this.selectedObject = null;
		
		this.addStartingObjects();
		this.addEventListeners();
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
	/**
		Инициализация объекта THREE.Scene, что содержит в себе все объекты на сцене.
	*/
	setupScene() {
		return new THREE.Scene();
	}
	/**
		Инициализурет камеру, из которой пользователь наблюдает за сценой.
	*/
	setupCamera() {
		const camera = new THREE.PerspectiveCamera(
			60, window.innerWidth / window.innerHeight,
			0.1, 1000
		);
		camera.position.set(0,3,3);

		return camera;
	}
	/**
		Инициализирует объект класса OrbitControls из библиотеки, позволяет пользователю управлять камерой с помощью мыши и клавиатуры. 
	*/
	setupOrbitControls(camera, renderer) {
		const controls = new OrbitControls(camera, renderer.domElement);
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
		this.guiManager.show();
	}
	
	/**
		Определить обеъкты, которыу будут добавлены после инициализации сцены.
	*/
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
		
		const box = this.meshFactory.createRestrainedMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial(),
			true, true, this.constraintBox
		);
		box.position.y -= box.geometry.boundingBox.min.y;
		box.position.x -= 1;
		
		const box2 = this.meshFactory.createRestrainedMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial(),
			true, true, this.constraintBox
		);
		box2.position.y -= box.geometry.boundingBox.min.y;
		box2.position.x += 1;
	}
	/**
		Добавляет слушатели событий, необходимые для работы этого класса
	*/
	addEventListeners(){
		let self = this;
		// Обновляет размер холста при изменении размеров окна браузера.
		// ПЕРЕПИСАТЬ - Работает неправильно, должно считать не от window, а от this.renderer.domElement
		window.addEventListener('resize', function(){
			self.camera.aspect = window.innerWidth / window.innerHeight;
			self.camera.updateProjectionMatrix();
			self.renderer.setSize(window.innerWidth, window.innerHeight);
		});
	}

	/**
		Добавляет модель или группу моделей на сцену.
	*/
	addObject(obj, isMovable, hasCollision) {
		if(isMovable) this.movableObjects.push(obj);
		if(hasCollision) {
			// this.objectsWithCollision.push(obj);
			this.applyToMeshes(obj, (o)=>{
				this.objectsWithCollision.push(o);
			});
		}
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
		console.log(obj);
		if(!obj) return;
		if (obj.userData.isRestrainedMesh) obj.setScale(x,y,z);
		else obj.scale.set(x,y,z);
	}
	/**
		Установить поворт модели*
	*/
	setRotation(obj,x,y,z){
		if(!obj) return;
		obj.rotation.x = x; obj.rotation.y = y; obj.rotation.z = z;
	}
	/**
		Установить цвет модели
	*/
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
	
	/**
		Уставновить модель как выбранную.
	*/
	setSelectedObject(obj) {
		if(this.selectedObject) this.removeSelectionColor(this.selectedObject);
		this.selectedObject = obj;
		this.applySelectionColor(this.selectedObject);
		this.guiManager.updateGui();
	}
	/**
		Отменить выделение модели
	*/
	unsetSelectedObject() {
		if(this.selectedObject) this.removeSelectionColor(this.selectedObject);
		this.selectedObject = null;
	}
	
	/**
		Убрать оранжевую подсветку у модели.
	*/
	removeSelectionColor(obj) {
		if (!obj) return;
		this.applyToMeshes(obj,
			(o)=>{o.material.emissive.set(0x000000)}
		);
	}
	/**
		Включить оранжевую подсветку у модели
	*/
	applySelectionColor(obj){
		this.applyToMeshes(obj,
			(o)=>{o.material.emissive.set(0x9c8e30)}
		);
	}
	/**
		Применить функцию cb с аргументами args ко всем потомкам-моделям объекта obj.
		По-хорошему надо вынести эту функцию в контроллер или в utils
	*/
	applyToMeshes(obj, cb, args) {
		
		if(obj.isMesh) {
			cb(obj, args);
		}
		else if(obj.isGroup) {
			for(let o of obj.children)
				this.applyToMeshes(o,cb,args);
		}
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
}
