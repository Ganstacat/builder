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
import {generateRamdomId} from './utils.js';
import {setCookie} from './cookieUtils.js';
/**
	Точка входа в приложение, создаются объекты, разрешаются зависимости
*/


const textureLoader = new THREE.TextureLoader();
const materialManager = new MaterialManager(textureLoader);

const assetLoader = new GLTFLoader();
const exporter = new GLTFExporter();
const exportManager = new ExportManager(exporter, assetLoader);

const dragEngine = new DragEnginePlane();
const labelManager = new LabelManager();
const drawEngine = new DrawEngine(dragEngine, materialManager, labelManager);

const controller = new MainController(dragEngine, drawEngine, exportManager, materialManager, labelManager);


const builderStage = new Stage(controller);
const floorStage = new FloorPlannerStage(controller);



controller.registerStage("builder", builderStage);
controller.registerStage("floorPlanner", floorStage);
controller.setCurrentStage("builder");



addListeners(controller);
addKeyboardControls(controller);


// TODO: стакающиеся блоки работают кривовато, посмотреть что не так и отладидть
// TOOD: Оформить фичу с таскаемыми блоками покрасивее

// TODO: Посмотреть как можно накрутить графон
// TODO: Посмотреть как динамически менять UV Развёрстку текстур при изменении размеров

// TODO: сделать методы для постройки стены и предоставить их через контроллер
// TODO: заменить начальные стенки в floorPlaner на те из drawEngine



const cook = 'userId';
const id = generateRamdomId();
if(!document.cookie){
    console.log('setting cookie');
    setCookie(cook, id, 1);
} else {
    console.log('Cookie:');
    console.log(document.cookie);
}


// exportManager.loadByLinkToStage('/index.php?mode=load', floorStage);
// exportManager.saveToDatabase(controller.currentStage.movableObjects, '/index.php?mode=load'); 