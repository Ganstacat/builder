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


// TODO: стакающиеся блоки работают кривовато, посмотреть что не так и отладидть
// TOOD: Оформить фичу с таскаемыми блоками покрасивее

// TODO: Посмотреть как можно накрутить графон
// TODO: Посмотреть как динамически менять UV Развёрстку текстур при изменении размеров

// TODO: сделать методы для постройки стены и предоставить их через контроллер
// TODO: заменить начальные стенки в floorPlaner на те из drawEngine

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function httpPost(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", theUrl); // false for synchronous request
    // xmlHttp.setRequestHeader('Content-type', 'application/json');
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlHttp.onload = () =>{
        console.log(xmlHttp.responseText);
    }
    xmlHttp.send('fname=Mary');
    return xmlHttp.responseText;
}
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function deleteCookie(cname){
    document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const cook = 'userId';
const id = utils.generateRamdomId();
if(!document.cookie){
    console.log('setting cookie');
    setCookie(cook, id, 1);
} else {
    console.log('Cookie:');
    console.log(document.cookie);
    // deleteCookie(cook);
}

// console.log(httpGet('/index.php'))



// exportManager.loadByLinkToStage('/index.php?mode=load', floorStage);
// exportManager.saveToDatabase(controller.currentStage.movableObjects, '/index.php?mode=load'); 