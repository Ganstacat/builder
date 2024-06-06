/**
	Функция, которая добавляет управление приложением с помощью клавиатуры.
	Управление:
	xyz - заблокировать перемещение объекта мышью по одной из осей, нажатие любой другой клавиши снимает блокировку.
	c - отключить коллизии и ограничения на перемещение для объектов
	46x, 28z, 39y - перемещение объекта по оси x,z,y
	
	1x 5y 7z - изменить длину, высоту или ширину
	+- выбрать, увеличивать или уменьшать размеры объекта при нажатии на 157
	q убрать выделение объекта
*/
export function addKeyboardControls(controller){
	let scaleSign = 1;
	document.addEventListener('keydown', (e) => {
		const selected = controller.getSelectedObject();
		
		if(['x','y','z'].includes(e.key))
			controller.lockDraggingAxis(e.key);
		else controller.disableDraggingLocks();
		
		switch (e.code) {
			case "KeyC":
				controller.switchCollision();
				break;
			case "Numpad4":
				controller.moveObject(selected, 'x', -0.1);
				break;
			case "Numpad6":
				controller.moveObject(selected, 'x', +0.1);
				break;
			case "Numpad8":
				controller.moveObject(selected, 'z', -0.1);
				break;
			case "Numpad2":
				controller.moveObject(selected, 'z', +0.1);
				break;
			case "Numpad3":
				controller.moveObject(selected, 'y', -0.1);
				break;
			case "Numpad9":
				controller.moveObject(selected, 'y', +0.1);
				break;
			case "Numpad7":
				controller.scaleObject(selected, 'y', scaleSign*0.1)
				break;
			case "Numpad1":
				controller.scaleObject(selected, 'x', scaleSign*0.1)
				break;		
			case "Numpad5":
				controller.scaleObject(selected, 'z', scaleSign*0.1)
				break;
			case "NumpadAdd":
				scaleSign = 1;
				break;
			case "NumpadSubtract":
				scaleSign = -1;
				break;
			case "KeyQ":
				controller.unsetSelection();
				controller.drawEngine.setDrawing(false);
				controller.dragEngine.setDragging(true);
				document.getElementById("drawing").checked = false;
				break;
		}
	});
}