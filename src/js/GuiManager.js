import * as dat from 'dat.gui';
import {Stage} from './Stage.js';
import * as utils from './utils.js';

/**
	Класс для более удобной работы с объектом dat.GUI из сторонней библиотеки. dat.GUI добавляет интерфейс, используемый для манипуляций над моделями в сцене: изменение размеров, поворот, цвет.
*/
export class GuiManager {
	
	/**
		Конструктор, определяет зависимость этого класса - объект класса Stage
	*/
	constructor(stage) {
		this.stage = stage;
		this.gui = new dat.GUI({autoplace: true});
		// this.gui.domElement = document.querySelector('#controls');
		this.listeners = [];
		this.setupOptions();
	}
	
	/**
		Обновляет значения на панели интерфейса для отражения актуального состояния объекта.
	*/
	updateGui() {
		for(let l of this.listeners)
			l();
		this.gui.updateDisplay();
	}
	/**
		Инициализация объекта интерфейа, определение параметров, которые можно менять через интерфейс.
		Для добавления новых параметров необходимо:
			1. Добавить новое поле в options
			2. Добавить опцию к объекту dat.gui
			3. Опционально - Добавить функцию, которая будет обновлять значения на интерфейсе в зависимости от реального состояния объекта.
	*/
	setupOptions(){
		const options = {
			"длина":1,
			"высота":1,
			"ширина":1,
			
			"поворотX":0,
			"поворотY":0,
			"поворотZ":0,
			
			"цвет": 0xFFFFFF,
			"размеры": true,

		};
		this.options = options;
		
		let self = this;

		
		this.gui.add(options, 'длина',0.1, 10, 0.1).onChange((e)=>{
			self.stage.setScale(self.stage.selectedObject, options["длина"], options["высота"], options["ширина"] );
		});
		this.gui.add(options, 'ширина',0.1, 10, 0.1).onChange((e)=>{
			self.stage.setScale(self.stage.selectedObject, options["длина"], options["высота"], options["ширина"] );
		});
		this.gui.add(options, 'высота',0.1, 10, 0.1).onChange((e)=>{
			self.stage.setScale(self.stage.selectedObject, options["длина"], options["высота"], options["ширина"] );
		});
		this.gui.add(options, 'поворотX',0, Math.PI*2, Math.PI/16).onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options["поворотX"], options["поворотY"], options["поворотZ"]);
		});
		this.gui.add(options, 'поворотY',0, Math.PI*2, Math.PI/16).onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options["поворотX"], options["поворотY"], options["поворотZ"]);
		});
		this.gui.add(options, 'поворотZ',0, Math.PI*2, Math.PI/16).onChange((e)=>{
			self.stage.setRotation(self.stage.selectedObject, options["поворотX"], options["поворотY"], options["поворотZ"]);
		});
		this.gui.add(options, 'размеры').onChange( (e)=>{
			for(let o of self.stage.movableObjects) {
				if (o.name === 'container') {
					for(let c of o.children){
						if (c.isLine || c.userData.isText) {
							c.visible = e;
						}
					}
				}
			}
		});
		this.gui.addColor(options, 'цвет').onChange((e)=>{
			self.stage.setMeshColor(self.stage.selectedObject, e);
		});
	
		
		this.listeners.push(()=>{
			if(!self.stage.selectedObject || self.stage.selectedObject.name !== "container") return;
			
			let models = self.stage.selectedObject.children.filter( (c) => {return c.name === 'models'});
			
			self.options["длина"] = models[0].scale.x;
			self.options["высота"] = models[0].scale.y;
			self.options["ширина"] = models[0].scale.z;
			
			self.options["поворотX"] = self.stage.selectedObject.rotation.x;
			self.options["поворотY"] = self.stage.selectedObject.rotation.y;
			self.options["поворотZ"] = self.stage.selectedObject.rotation.z;
			
			if(self.stage.selectedObject.isMesh) self.options["цвет"] = self.stage.selectedObject.material.color.getHex();
			else {
				self.stage.applyToMeshes(
					self.stage.selectedObject,
					(o)=>{
						utils.applyToArrayOrValue(
							o.material,
							(m)=>{
								self.options["цвет"] = m.color.getHex();
							}
						);
					}
				)
			}
		})
	}
	
	/**
		Скрыть dat.GUI Элемент
	*/
	hide(){
		this.gui.hide();
	}
	/**
		Отобразить dat.GUI Элемент.
	*/
	show(){
		this.gui.show();
	}
	
	
	
	// не используется, выкрутасы не работают
	// хотя возможно в какой-то момент будут использоваться.
	// 		возможно, не работает из-за того, что ...args это массив, а в этой версии функци это не учитывается.
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