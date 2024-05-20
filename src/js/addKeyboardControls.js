/**
	Функция, которая добавляет управление приложением с помощью клавиатуры.
	Управление:
	xyz - заблокировать перемещение объекта мышью по одной из осей, нажатие любой другой клавиши снимает блокировку.
	c - отключить коллизии и ограничения на перемещение для объектов
	46x, 28z, 39y - перемещение объекта по оси x,z,y
	1x 5y 7z - выбрать, какой параметр объекта изменять - длину, высоту. ширину
		+- увеличить или уменьшить размер объекта 
		q убрать выделение объекта
*/
export function addKeyboardControls(controller){
	let keyboardScaleAxis = 'x';
	document.addEventListener('keydown', (e) => {
		controller.dragEngine.resetLocks();
		controller.dragEngine.pNormal = controller.dragEngine.pNormalHorizontal;
		switch (e.code) {
			case "KeyX":
				controller.dragEngine.lockX = true;
				break;
			case "KeyY":
				controller.dragEngine.lockY = true;
				controller.dragEngine.pNormal = controller.dragEngine.pNormalVertical;
				break;
			case "KeyZ":
				controller.dragEngine.lockZ = true;
				break;
			case "KeyC":
				controller.dragEngine.collision = !controller.dragEngine.collision;
				break;
			
			case "Numpad4":
				controller.currentStage.selectedObject.position.x -= 0.1;
				break;
			case "Numpad6":
				controller.currentStage.selectedObject.position.x += 0.1;
				break;
			case "Numpad2":
				controller.currentStage.selectedObject.position.z += 0.1;
				break;
			case "Numpad8":
				controller.currentStage.selectedObject.position.z -= 0.1;
				break;
			case "Numpad3":
				controller.currentStage.selectedObject.position.y -= 0.1;
				break;
			case "Numpad9":
				controller.currentStage.selectedObject.position.y += 0.1;
				break;
			case "Numpad7":
				keyboardScaleAxis = "y";
				break;
			case "Numpad1":
				keyboardScaleAxis = "x";
				break;		
			case "Numpad5":
				keyboardScaleAxis = "z";
				break;
			case "NumpadAdd":
				switch (keyboardScaleAxis) {
					case "x":
						controller.currentStage.selectedObject.scale.x += 0.1;
						break;
					case "y":
						controller.currentStage.selectedObject.scale.y += 0.1;
						break;
					case "z":
						controller.currentStage.selectedObject.scale.z += 0.1;
						break;
				}
				break;
			case "NumpadSubtract":
				switch (keyboardScaleAxis) {
					case "x":
						controller.currentStage.selectedObject.scale.x -= 0.1;
						break;
					case "y":
						controller.currentStage.selectedObject.scale.y -= 0.1;
						break;
					case "z":
						controller.currentStage.selectedObject.scale.z -= 0.1;
						break;
				}
				break;
			case "KeyQ":
				controller.currentStage.unsetSelectedObject();
				break;
		}
		if (controller.dragEngine.dragObject) controller.dragEngine.tryPickup();
		controller.currentStage.guiManager.updateGui();
		
		if(controller.currentStage.selectedObject && controller.currentStage.selectedObject.userData.isRestrainedMesh){
			controller.currentStage.selectedObject.adjustRestraintForScale();
			controller.dragEngine.applyRestraint(controller.currentStage.selectedObject);
		}
		
		if(controller.currentStage.selectedObject) {
			controller.dragEngine.applyCollision(controller.currentStage.selectedObject);
		}
	});
}