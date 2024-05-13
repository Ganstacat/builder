import * as dat from 'dat.gui';
import {Stage} from './Stage.js';

export class GuiManager {
	
	constructor(stage) {
		this.stage = stage;
		this.gui = new dat.GUI({autoplace: false});
		// this.gui.domElement = document.querySelector('#controls');
		this.listeners = [];
		this.setupOptions();
	}
	
	updateGui() {
		for(let l of this.listeners)
			l();
		this.gui.updateDisplay();
	}
	setupOptions(){
		let options = {
			"длина":1,
			"высота":1,
			"ширина":1,
			
			"поворотX":0,
			"поворотY":0,
			"поворотZ":0,
			
			цвет: 0xFFFFFF

		};
		this.options = options;
		
		let self = this;
	
		this.gui.add(options, 'длина',0.1, 10).listen().onChange((e)=>{
			self.stage.setScale(self.stage.selectedObject, options["длина"], options["высота"], options["ширина"] );
		});
		this.gui.add(options, 'ширина',0.1, 10).listen().onChange((e)=>{
			self.stage.setScale(self.stage.selectedObject, options["длина"], options["высота"], options["ширина"] );
		});
		this.gui.add(options, 'высота',0.1, 10).listen().onChange((e)=>{
			self.stage.setScale(self.stage.selectedObject, options["длина"], options["высота"], options["ширина"] );
		});
		this.gui.add(options, 'поворотX',0, Math.PI, Math.PI/16).listen().onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options["поворотX"], options["поворотY"], options["поворотZ"]);
		});
		this.gui.add(options, 'поворотY',0, Math.PI, Math.PI/16).listen().onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options["поворотX"], options["поворотY"], options["поворотZ"]);
		});
		this.gui.add(options, 'поворотZ',0, Math.PI, Math.PI/16).listen().onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options["поворотX"], options["поворотY"], options["поворотZ"]);
		});
		this.gui.addColor(options, 'цвет').onChange((e)=>{
			self.stage.setMeshColor(self.stage.selectedObject, e);
		});
		
		this.listeners.push(()=>{
			if(!self.stage.selectedObject) return;
			
			self.options["длина"] = self.stage.selectedObject.scale.x;
			self.options["высота"] = self.stage.selectedObject.scale.y;
			self.options["ширина"] = self.stage.selectedObject.scale.z;
			
			self.options["поворотX"] = self.stage.selectedObject.rotation.x;
			self.options["поворотY"] = self.stage.selectedObject.rotation.y;
			self.options["поворотZ"] = self.stage.selectedObject.rotation.z;
			
			if(self.stage.selectedObject.isMesh) self.options["цвет"] = self.stage.selectedObject.material.color.getHex();
			else {
				self.stage.applyToMeshes(self.stage.selectedObject,
					(o)=>{self.options["цвет"] = o.material.color.getHex();}
				)
			}
		})
	}
	
	hide(){
		this.gui.hide();
	}
	show(){
		this.gui.show();
	}
	
	
	
	// не используется, выкрутасы не работают
	// addNumOptions(options, min, max, step, onchange, ...args) {
		// for(let [key,v] of Object.entries(options))
			// this.gui.add(options, key, min, max, step).onChange( (e)=>{
				
				// onchange(args, e); 
			// });
	// }
	// addColorOptions(options, onchange, ...args) {
		// for(let [key,v] of Object.entries(options))
			// this.gui.add(options, key).onChange( (e) => { onchange(args, e) });
	// }
	
	
}