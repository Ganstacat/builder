import {DragEnginePlane} from './DragEnginePlane.js' 

/**
	Класс - контроллер для управления сценами.
	Хранит в своих полях: все зарегестрированные сцены, DragEngine, ExportManager, MaterialManager.
	(В теории, по крайней мере. Сейчас это больше похоже на массив с глобальными переменными. Для превращения этого класса в контролер надо определить методы, которые будут взаимодействовать с объектами в полях. Когда-нибудь я этим займусь...)
*/
export class MainController {
	
	/**
		Инициализация класса.
	*/
	constructor(dragEngine, exportManager, materialManager) {
		this.stages = new Map();
		this.currentStage;
		this.dragEngine = dragEngine;
		this.exportManager = exportManager;
		this.materialManager = materialManager;
	}

	/**
		Зарегестрировать сцену и добавить к ней слушатели событий от DragEngine
	*/
	registerStage(key, stage) {
		this.stages.set(key, stage);
		this.dragEngine.setStage(stage);
		this.dragEngine.addEventListenersToStage();
	}
	/**
		Получить какую-то сцену по ключу
	*/
	getStage(key) {
		let stage = this.stages.get(key);
		if (!stage) throw key+" stage is not defined";
		return stage;
	}
	/*
		Скрыть текущую сцену и dat.GUI, прилепленный к ней
	**/
	hideCurrentStage() {
		if(this.currentStage) {
			this.currentStage.hideScene();
		}
	}
	/**
		Скрыть все зарегестрированные сцены
	*/
	hideAllStages() {
		for(let st of this.stages.values()) {
			st.hideScene();
		}
	}
	/**
		Показать текущую сцену.
	*/
	showCurrentStage() {
		if(this.currentStage) {
			this.currentStage.showScene();
		}
	}
	
	/**
		Установить определённую сцену из зарегестрированных текущей.
	*/
	setCurrentStage(key) {
		this.hideAllStages();
		this.currentStage = this.getStage(key);
		this.dragEngine.setStage(this.currentStage);
		this.showCurrentStage();
	}
	
	/**
		Пока не используется.
	*/
	addListeners(){
		let self = this;
	}
		
}