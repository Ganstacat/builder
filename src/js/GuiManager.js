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
			scalex:1,
			scaley:1,
			scalez:1,
			
			rotationx:0,
			rotationy:0,
			rotationz:0,
			
			color: 0xFFFFFF

		};
		this.options = options;
		
		let self = this;
	
		this.gui.add(options, 'scalex',0.1, 10).listen().onChange((e)=>{self.stage.setScale(self.stage.selectedObject, options.scalex, options.scaley, options.scalez );});
		this.gui.add(options, 'scaley',0.1, 10).listen().onChange((e)=>{self.stage.setScale(self.stage.selectedObject, options.scalex, options.scaley, options.scalez );});
		this.gui.add(options, 'scalez',0.1, 10).listen().onChange((e)=>{self.stage.setScale(self.stage.selectedObject, options.scalex, options.scaley, options.scalez );});
		this.gui.add(options, 'rotationx',0, Math.PI, Math.PI/16).listen().onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options.rotationx, options.rotationy, options.rotationz);
		});
		this.gui.add(options, 'rotationy',0, Math.PI, Math.PI/16).listen().onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options.rotationx, options.rotationy, options.rotationz);
		});
		this.gui.add(options, 'rotationz',0, Math.PI, Math.PI/16).listen().onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options.rotationx, options.rotationy, options.rotationz);
		});
		this.gui.addColor(options, 'color').onChange((e)=>{
			self.stage.setMeshColor(self.stage.selectedObject, e);
		});
		
		this.listeners.push(()=>{
			if(!self.stage.selectedObject) return;
			
			self.options.scalex = self.stage.selectedObject.scale.x;
			self.options.scaley = self.stage.selectedObject.scale.y;
			self.options.scalez = self.stage.selectedObject.scale.z;
			
			self.options.rotationx = self.stage.selectedObject.rotation.x;
			self.options.rotationy = self.stage.selectedObject.rotation.y;
			self.options.rotationz = self.stage.selectedObject.rotation.z;
			
			if(self.stage.selectedObject.isMesh) self.options.color = self.stage.selectedObject.material.color.getHex();
			else {
				self.stage.applyToMeshes(self.stage.selectedObject,
					(o)=>{self.options.color = o.material.color.getHex();}
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