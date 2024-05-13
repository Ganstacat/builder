import * as THREE from 'three';
export function addListeners(controller) {
	let floorPlanner = "floorPlanner";
	let builder = "builder";
	
	document.querySelector("#floorPlanner").onclick = function(){	
		controller.setCurrentStage(floorPlanner);
	};
	document.querySelector("#builder").onclick = function(){
		controller.setCurrentStage(builder);
	};
	document.querySelector("#exportToFloor").onclick = function(){	
		controller.exportManager.exportToStage(
			controller.getStage(builder).movableObjects,
			controller.getStage(floorPlanner)
		);
	}
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
	document.querySelector("#addCube").onclick = function(){
		let box = controller.currentStage.meshFactory.createRestrainedMesh(
			new THREE.BoxGeometry(0.5,0.5,0.5),
			new THREE.MeshStandardMaterial({side: THREE.DoubleSide}),
			true, true, controller.currentStage.constraintBox
		);
		box.position.y -= box.geometry.boundingBox.min.y;
	}
	document.querySelector("#addWall").onclick = function(){
		let cbox = controller.currentStage.constraintBox;
		let len = cbox.max.x - cbox.min.x;
		let hei = cbox.max.y - cbox.min.y;
		
		let box = controller.currentStage.meshFactory.createRestrainedMesh(
			new THREE.BoxGeometry(len,hei,0.1),
			new THREE.MeshStandardMaterial({side: THREE.DoubleSide}),
			true, true, controller.currentStage.constraintBox
		);
		box.castShadow = true;
		box.position.y -= box.geometry.boundingBox.min.y;
	}
	document.querySelector("#delobj").onclick = function() {
		controller.currentStage.removeObject(controller.currentStage.selectedObject);
	}
	
	document.querySelector("#clear").onclick = function() {
		controller.currentStage.clearScene();
	}
	
	document.querySelector("#clone").onclick = function(){
		if(!controller.currentStage.selectedObject) return;
		
		controller.currentStage.removeSelectionColor(controller.currentStage.selectedObject);

		console.log(controller.currentStage.selectedObject.userData.restraint);
		let newObject = controller.currentStage.meshFactory.cloneObject(controller.currentStage.selectedObject);
		
		if (newObject) {
			controller.currentStage.addObject(newObject, newObject.isMovable, newObject.hasCollision);
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
	const materialSelector = document.querySelector("#materials");
	materialSelector.onchange = function (e) {
		if (controller.currentStage.selectedObject && controller.currentStage.selectedObject.isMesh)
			controller.materialManager.setMeshTexture(controller.currentStage.selectedObject, materialSelector.value);
		else if (controller.currentStage.selectedObject) {
			controller.currentStage.applyToMeshes(controller.currentStage.selectedObject, (o) => { controller.materialManager.setMeshTexture(o, materialSelector.value); });
		}
	}
}