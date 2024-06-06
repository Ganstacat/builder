import * as THREE from 'three';
import * as utils from './utils.js';
import { calculatePrice } from './priceCalculator.js';

/**
	Функция, устанавливающая поведение кнопок управления, определённых в html файле.
*/
export function addListeners(controller) {
	const floorPlanner = "floorPlanner";
	const builder = "builder";
	
	// Смена текущей сцены на Планировщик
	document.querySelector("#floorPlanner").onclick = function(){
		controller.setCurrentStage(floorPlanner);
	};
	// Смена текущей сцены на Сборщик
	document.querySelector("#builder").onclick = function(){
		if(!controller.dragEngine.dragging) return; // не тащим = рисуем, рисовать можно только в floorPlanner
		controller.setCurrentStage(builder);
	};
	// Перенос объектов из сцены Сборщика в сцену Планировщика
	document.querySelector("#exportToFloor").onclick = function(){	
		controller.exportObjectsToStage(
			controller.getStage(builder).movableObjects,
			controller.getStage(floorPlanner)
		);
	}
	// Скачать объекты из текущей сцены на устройство пользователя
	document.querySelector("#downloadScene").onclick = function(){
		controller.downloadStageToUserPc(controller.getCurrentStage());
	}
	// Добавить куб на текущую сцену. Куб ограничен в пределах сцены.
	// document.querySelector("#addCube").onclick = function(){
	// 	const box = utils.createMesh(
	// 		new THREE.BoxGeometry(0.5,0.5,0.5),
	// 		new THREE.MeshStandardMaterial({side: THREE.DoubleSide})
	// 	);
	// 	controller.addObjectToCurrentStage(box,true,true,true);
	// }
	// Добавить стену на текущую сцену. Стена имеет высоту и длину по размеру сцены и ограничена в её пределах.
	// эта функция будет выпилена позже
	// document.querySelector("#addWall").onclick = function(){
	// 	let cbox = controller.currentStage.constraintBox;
	// 	let len = cbox.max.x - cbox.min.x;
	// 	let hei = cbox.max.y - cbox.min.y;
		
	// 	let box = utils.createMesh(
	// 		new THREE.BoxGeometry(len,hei,0.1),
	// 		new THREE.MeshStandardMaterial({side: THREE.DoubleSide})
	// 	);
	// 	box.castShadow = true;
	// 	controller.addObjectToCurrentStage(box,true,true,true);
	// }
	// Удалить выбранный объект
	document.querySelector("#delobj").onclick = function() {
		controller.removeObjectFromCurrentStage(controller.getSelectedObject());
	}
	
	// Отчистить текущую сцену от объектов
	document.querySelector("#clear").onclick = function() {
		controller.clearCurrentStage();
	}
	
	// Клонировать выбранный объект.
	document.querySelector("#clone").onclick = function(){

		const selected = controller.getSelectedObject();
		if(!selected) return;
		console.log(selected);
		utils.doWithoutLabels(selected, (obj)=>{
			const parentNode = obj.userData.parentNode;
			obj.userData.parentNode = null;
			controller.removeSelectionColor(obj);

			const newObject = utils.cloneObject(obj);

			obj.userData.parentNode = parentNode;
			
			newObject.userData.baserestraint = null;
			
			// controller.currentStage.scene.add(newObject);
			controller.currentStage.addObject(
				newObject, 
				newObject.userData.isMovable,
				newObject.userData.hasCollision,
				newObject.userData.hasDimensions,
				newObject.userData.isPackable
				// false
			);

		});
		
		// controller.applySelectionColor(selected);
		
	}
	
	// Выбор материала для выбранного объекта
	const materialSelector = document.querySelector("#materials");
	materialSelector.onchange = function (e) {
		const selected = controller.getSelectedObject();
		const texture = materialSelector.value;
		if (!selected || texture === 'reset') return;
		
		controller.setObjectTexture(selected, texture)
		
		materialSelector.value = 'reset';
	}
	document.querySelector('#saveScene').onclick = ()=>{
		console.log('saving');
		controller.saveToDatabase(controller.getStage(floorPlanner).movableObjects, '/index.php?mode=save');
		// controller.exportManager.saveToDatabase(controller.getStage(floorPlanner).movableObjects, '/index.php?mode=save'); 
	}
	
	// загрузка пользовательского файла на сцену
	document.querySelector('#upload').onclick = function (){
		document.querySelector('#file').click();
	};
	document.querySelector('form').addEventListener('submit', (e)=>{e.preventDefault();});
	document.querySelector('#file').addEventListener("change", function handleFiles(){
		const fileList = this.files;
		controller.uploadUserFileToStage(fileList[0], controller.getCurrentStage());
	}, false);
	
	document.querySelector('#drawing').addEventListener('change', (e)=>{
		controller.setCurrentStage(floorPlanner);
		if(e.target.checked) controller.currentStage.switchToOrthoCamera();
		controller.drawEngine.setDrawing(e.target.checked);
		controller.dragEngine.setDragging(!e.target.checked);
	});

	const addElementSelector = document.querySelector('#addElement');
	addElementSelector.onchange = (e)=>{
		elementAdderHandler(addElementSelector.value, controller);
		addElementSelector.value = 'reset';
	}
	document.querySelector('#firstPerson').onclick = ()=>{
		if(!controller.dragEngine.dragging) return; // не тащим = рисуем, рисовать можно только в floorPlanner
		controller.currentStage.switchTo1PCamera();
	}
	document.querySelector('#thirdPerson').onclick = ()=>{
		if(!controller.dragEngine.dragging) return; // не тащим = рисуем, рисовать можно только в floorPlanner
		controller.currentStage.switchTo3PCamera();
	}
	document.querySelector('#orthoPerson').onclick = ()=>{
		if(!controller.dragEngine.dragging) return; // не тащим = рисуем, рисовать можно только в floorPlanner
		controller.currentStage.switchToOrthoCamera();
	}
	document.querySelector('#deselect').onclick = ()=>{
		controller.currentStage.unsetSelectedObject();
	}
}
function elementAdderHandler(element, controller){
	if(!element || element === 'reset') return;
	
	let geometry;
	let material = new THREE.MeshStandardMaterial();
	switch(element){
		case 'cube': geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); break;
		case 'sphere': geometry = new THREE.SphereGeometry(0.25); break;
		case 'pyramid': geometry = new THREE.ConeGeometry(0.25, 0.5, 3); break;
		case 'cone': geometry = new THREE.ConeGeometry(0.25, 0.5, 16); break;
		case 'cylinder': geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5); break;
	}

	const object = utils.createMesh(geometry, material);
	controller.addObjectToCurrentStage(object, true, true, true);
}