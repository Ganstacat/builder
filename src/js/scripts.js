import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as dat from 'dat.gui';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';


import {Text} from 'troika-three-text';


import {Stage} from './Stage.js';
import {FloorPlannerStage} from './FloorPlannerStage.js';
import {DragEnginePlane} from './DragEnginePlane.js';
import {MaterialManager} from './MaterialManager.js';
import {MainController} from './MainController.js';
import {ExportManager} from './ExportManager.js';
import {LabelManager} from './LabelManager.js';
import {addListeners} from './addListeners.js';
import {addKeyboardControls} from './addKeyboardControls.js';
import {DrawEngine} from './DrawEngine.js';
import * as utils from './utils.js';

/**
	Точка входа в приложение, создаются объекты, разрешаются зависимости
*/


const textureLoader = new THREE.TextureLoader();
const materialManager = new MaterialManager(textureLoader);

const assetLoader = new GLTFLoader();
const exporter = new GLTFExporter();
const exportManager = new ExportManager(exporter, assetLoader);

const dragEngine = new DragEnginePlane();
const drawEngine = new DrawEngine(dragEngine, materialManager);

const labelManager = new LabelManager();
const controller = new MainController(dragEngine, drawEngine, exportManager, materialManager, labelManager);


const builderStage = new Stage(controller);
const floorStage = new FloorPlannerStage(controller);



controller.registerStage("builder", builderStage);
controller.registerStage("floorPlanner", floorStage);
controller.setCurrentStage("builder");



addListeners(controller);
addKeyboardControls(controller);



// TODO: сделать таскание за ноды, а не только за стены
// TODO: сделать методы для постройки стены и предоставить их через контроллер
// TODO: заменить начальные стенки в floorPlaner на те из drawEngine
// TODO: проверить, что коллизии нормально работают

