import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

import {Stage} from './Stage.js';
import {FloorPlannerStage} from './FloorPlannerStage.js';
import {DragEnginePlane} from './DragEnginePlane.js';
import {MaterialManager} from './MaterialManager.js';
import {MainController} from './MainController.js';
import {ExportManager} from './ExportManager.js';
import {addListeners} from './addListeners.js';
import {addKeyboardControls} from './addKeyboardControls.js';

const dragEngine = new DragEnginePlane();

const textureLoader = new THREE.TextureLoader();
const materialManager = new MaterialManager(textureLoader);

const assetLoader = new GLTFLoader();
const exporter = new GLTFExporter();
const exportManager = new ExportManager(exporter, assetLoader);
const mainController = new MainController(dragEngine, exportManager, materialManager);

const builderStage = new Stage();
const floorStage = new FloorPlannerStage();

mainController.registerStage("builder", builderStage);
mainController.registerStage("floorPlanner", floorStage);
mainController.setCurrentStage("builder");


addListeners(mainController);
addKeyboardControls(mainController);
