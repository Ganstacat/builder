import * as THREE from 'three';

/**
	Функция, устанавливающая поведение кнопок управления, определённых в html файле.
*/
export function addListeners(controller) {
	let floorPlanner = "floorPlanner";
	let builder = "builder";
	
	// Смена текущей сцены на Планировщик
	document.querySelector("#floorPlanner").onclick = function(){	
		controller.setCurrentStage(floorPlanner);
	};
	// Смена текущей сцены на Сборщик
	document.querySelector("#builder").onclick = function(){
		controller.setCurrentStage(builder);
	};
	// Перенос объектов из сцены Сборщика в сцену Планировщика
	document.querySelector("#exportToFloor").onclick = function(){	
		controller.exportManager.exportToStage(
			controller.getStage(builder).movableObjects,
			controller.getStage(floorPlanner)
		);
	}
	// Скачать объекты из текущей сцены на устройство пользователя
	document.querySelector("#downloadScene").onclick = function(){
		console.log("ad");
		controller.currentStage.removeSelectionColor(controller.currentStage.selectedObject);
		let exportable = controller.currentStage.scene.children.filter((o) => {
			if(o.userData.isMovable || o.userData.isSelectable || o.isGroup) return o;
		})
		controller.exportManager.downloadScene(
			exportable
		);
	}
	// Добавить куб на текущую сцену. Куб ограничен в пределах сцены.
	document.querySelector("#addCube").onclick = function(){
		let box = controller.currentStage.meshFactory.createMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial({side: THREE.DoubleSide}),
			// controller.currentStage.constraintBox
		);
		// box.position.y -= box.geometry.boundingBox.min.y;
		controller.currentStage.addObject(box,true,true);
	}
	// Добавить стену на текущую сцену. Стена имеет высоту и длину по размеру сцены и ограничена в её пределах.
	document.querySelector("#addWall").onclick = function(){
		let cbox = controller.currentStage.constraintBox;
		let len = cbox.max.x - cbox.min.x;
		let hei = cbox.max.y - cbox.min.y;
		
		let box = controller.currentStage.meshFactory.createMesh(
			new THREE.BoxGeometry(len,hei,0.1),
			new THREE.MeshStandardMaterial({side: THREE.DoubleSide})
		);
		box.castShadow = true;
		controller.currentStage.addObject(box,true,true);
		// box.position.y -= box.geometry.boundingBox.min.y;
	}
	// Удалить выбранный объект
	document.querySelector("#delobj").onclick = function() {
		controller.currentStage.removeObject(controller.currentStage.selectedObject);
	}
	
	// Отчистить текущую сцену от объектов
	document.querySelector("#clear").onclick = function() {
		controller.currentStage.clearScene();
	}
	
	// Клонировать выбранный объект.
	document.querySelector("#clone").onclick = function(){
		if(!controller.currentStage.selectedObject) return;
		
		controller.currentStage.removeSelectionColor(controller.currentStage.selectedObject);

		console.log(controller.currentStage.selectedObject.userData.restraint);
		let newObject = controller.currentStage.meshFactory.cloneObject(controller.currentStage.selectedObject);
		
		if (newObject) {
			controller.currentStage.addObject(newObject, newObject.userData.isMovable, newObject.userData.hasCollision);
			newObject.position.set(
				controller.currentStage.selectedObject.position.x,
				controller.currentStage.selectedObject.position.y,
				controller.currentStage.selectedObject.position.z
			);
			newObject.scale.set(
				controller.currentStage.selectedObject.scale.x,
				controller.currentStage.selectedObject.scale.y,
				controller.currentStage.selectedObject.scale.z
			);
			newObject.rotation.set(
				controller.currentStage.selectedObject.rotation.x,
				controller.currentStage.selectedObject.rotation.y,
				controller.currentStage.selectedObject.rotation.z
			);
		}
		
	}
	
	// Выбор материала для выбранного объекта
	const materialSelector = document.querySelector("#materials");
	materialSelector.onchange = function (e) {
		if (materialSelector.value === 'reset') return;
		
		if (controller.currentStage.selectedObject && controller.currentStage.selectedObject.isMesh)
			controller.materialManager.setMeshTexture(controller.currentStage.selectedObject, materialSelector.value);
		else if (controller.currentStage.selectedObject) {
			controller.currentStage.applyToMeshes(controller.currentStage.selectedObject, (o) => { controller.materialManager.setMeshTexture(o, materialSelector.value); });
		}
		
		materialSelector.value = 'reset';
	}
	
	// загрузка пользовательского файла на сцену
	document.querySelector('#upload').onclick = function (){
		document.querySelector('#file').click();
	};
	document.querySelector('form').addEventListener('submit', (e)=>{e.preventDefault();});
	document.querySelector('#file').addEventListener("change", function handleFiles(){
		const fileList = this.files;
		controller.exportManager.loadBlobToStage(fileList[0], controller.currentStage);
	}, false);
	
}