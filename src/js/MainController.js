import {DragEnginePlane} from './DragEnginePlane.js' 

export class MainController {
	
	constructor(dragEngine, exportManager, materialManager) {
		this.stages = new Map();
		this.currentStage;
		this.dragEngine = dragEngine;
		this.exportManager = exportManager;
		this.materialManager = materialManager;
	}

	registerStage(key, stage) {
		this.stages.set(key, stage);
		this.dragEngine.setStage(stage);
		this.dragEngine.addEventListenersToStage();
	}
	getStage(key) {
		let stage = this.stages.get(key);
		if (!stage) throw key+" stage is not defined";
		return stage;
	}
	hideCurrentStage() {
		if(this.currentStage) {
			this.currentStage.hideScene();
		}
	}
	hideAllStages() {
		for(let st of this.stages.values()) {
			st.hideScene();
		}
	}
	showCurrentStage() {
		if(this.currentStage) {
			this.currentStage.showScene();
		}
	}
	
	setCurrentStage(key) {
		this.hideAllStages();
		this.currentStage = this.getStage(key);
		this.dragEngine.setStage(this.currentStage);
		this.showCurrentStage();
	}
	
	addListeners(){
		let self = this;
	}
		
}