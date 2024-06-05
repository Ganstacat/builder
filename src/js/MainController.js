import {DragEnginePlane} from './DragEnginePlane.js' 
import * as utils from './utils.js';

/**
	Класс - контроллер для управления сценами.
	Хранит в своих полях: все зарегестрированные сцены, DragEngine, ExportManager, MaterialManager.
	(В теории, по крайней мере. Сейчас это больше похоже на массив с глобальными переменными. Для превращения этого класса в контролер надо определить методы, которые будут взаимодействовать с объектами в полях. Когда-нибудь я этим займусь...)
*/
export class MainController {
	
	/**
		Инициализация класса.
	*/
	constructor(dragEngine, drawEngine, exportManager, materialManager, labelManager) {
		this.stages = new Map();
		this.currentStage;
		this.dragEngine = dragEngine;
		this.drawEngine = drawEngine;
		this.exportManager = exportManager;
		this.materialManager = materialManager;
		this.labelManager = labelManager;
	}

	/**
		Зарегестрировать сцену и добавить к ней слушатели событий от DragEngine
	*/
	registerStage(key, stage) {
		this.stages.set(key, stage);
		this.dragEngine.setStage(stage);
		this.dragEngine.addEventListenersToStage();
		
		this.drawEngine.setStage(stage);
		this.drawEngine.addEventListenersToStage();
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
	getCurrentStage(){
		return this.currentStage;
	}
	/**
		Скрыть все зарегистрированные сцены
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
		this.drawEngine.setStage(this.currentStage);
		this.showCurrentStage();
	}
	
	/**
		Пока не используется.
	*/
	addListeners(){
		let self = this;
	}
	
	
	
	addObjectToCurrentStage(obj, isMovable, hasCollision, hasDimensions, isPackable){
		this.currentStage.addObject(obj, isMovable, hasCollision, hasDimensions, isPackable);
	}
	removeObjectFromCurrentStage(obj){
		this.currentStage.removeObject(obj);
	}
	
	addLabelToObject(obj){
		this.labelManager.addLabelToObject(obj);
	}
	removeLabelFromObject(obj){
		this.labelManager.removeLabel(obj);
	}
	
	
	clearCurrentStage(){
		this.currentStage.clearScene();
		this.drawEngine.clearWalls();
	}

	disableDraggingLocks(){
		this.dragEngine.resetLocks();
	}
	lockDraggingAxis(axis){
		this.dragEngine.lockAxis(axis);
	}
	switchCollision(){
		const collision = this.dragEngine.isCollisionEnabled();
		this.dragEngine.setCollision(!collision);
	}
	getSelectedObject(){
		return this.currentStage.getSelectedObject();
	}

	moveObject(obj, axis, amount){
		const prevpos = obj.position.clone();
		this.currentStage.moveObject(obj, axis, amount);
		// this.applyCollisionAndRestraint(obj, prevpos);
	}
	scaleObject(obj, axis, amount){
		const prevpos = obj.position.clone();
		this.currentStage.scaleObjectAxisScalar(obj, axis, amount);
		// this.applyCollisionAndRestraint(obj, prevpos);
	}
	applyCollisionAndRestraint(obj, prevpos){
		this.dragEngine.applyRestraint(obj, prevpos);
		this.dragEngine.applyCollision(obj, prevpos);
	}
	
	unsetSelection(){
		this.currentStage.unsetSelectedObject();
	}
	removeSelectionColor(obj){
		this.currentStage.removeSelectionColor(obj);
	}
	applySelectionColor(obj){
		this.currentStage.applySelectionColor(obj);
	}

	#doExporting(objects, cb,args){
		this.unsetSelection();
		for (let o of objects) {
			this.removeLabelFromObject(o);
		}
		
		cb(args);
		
		for (let o of objects) {
			this.addLabelToObject(o);
		}
	}

	saveToDatabase(objects, apiUrl){
		this.#doExporting(objects, ()=>{
			this.exportManager.saveToDatabase(objects, apiUrl);
		});
	}

	exportObjectsToStage(objects, stageTo) {
		this.#doExporting(objects, ()=>{
			this.exportManager.exportToStage(objects, stageTo);
		});
		// utils.doWithoutLabels(objects, (o)=>{
		// 	this.exportManager.exportToStage(o, stageTo);
		// });
	}
	downloadStageToUserPc(stage){
		let exportable = stage.scene.children.filter((o) =>{
			if(o.userData.isMovable || o.userData.isSelectable || o.isGroup) return o;
		});
		// а нахуя вот это всё усложнять? пиздец...
		this.#doExporting(exportable, ()=>{
			this.exportManager.downloadScene(exportable);
		},this, stage)
	}
	
	setObjectTexture(obj, textureKey){
		this.materialManager.setMeshTexture(obj,textureKey);
	}
	
	uploadUserFileToStage(file, stage){
		this.exportManager.loadBlobToStage(file, stage);
	}

	getRaycaster(){
		return this.currentStage.raycaster;
	}
	getDraggingPlane(){
		return this.dragEngine.planeDrag;
	}

}