
import { BoxesTree } from './BoxesTree.js';
import * as utils from './utils.js';
import * as THREE from 'three';



const box3sTrees = [];

export function addNewBox3Tree(box){
    box3sTrees.push(new BoxesTree(box));
}
function findBoxTree(box){
    for(let tree of box3sTrees)
        if(tree.find(box)) return tree
    return undefined;
}

function addToBoxesTreesList(parentBox, boxes){
    let parentNode;
    let parentTree;
    for(let tree of box3sTrees){
        parentNode = tree.find(parentBox);
        if(parentNode){
            parentTree = tree;
            break;
        }
    }
    if(!parentNode){
        const newTree = new BoxesTree(parentBox);
        parentNode = newTree.getRoot();
        box3sTrees.push(newTree);
        parentTree = newTree;
    }
    for(let b of boxes){
        parentTree.insert(parentBox, b);
    }
    return {parentNode:parentNode, parentTree: parentTree};
}

function getBox3Slice(b){
	b.isSlice = true;
	return b;
}
function getObjSlice(obj){
	const model = utils.getModelsGroup(obj);
	const box3 = new THREE.Box3().setFromObject(model);
	return getBox3Slice(box3);
}

// function applyToBoxAndChildren(box, cb, args){
// 	cb(box,args);
// 	if(box.childBoxes && box.childBoxes.length > 0)
// 		for(let b of box.childBoxes)
// 			applyToBoxAndChildren(b, cb, args);
// }
function divideBox3BySlice(box, slice){
	const boxes = [];

	
	if(utils.round(box.min.y) === utils.round(slice.min.y)){
		// вертикальная балка
		boxes.push(new THREE.Box3(
			box.min,
			new THREE.Vector3(slice.min.x, slice.max.y, slice.max.z)
		));
		boxes.push(new THREE.Box3(
			new THREE.Vector3(slice.max.x, slice.min.y, slice.min.z),
			box.max,
		));

	} else if (utils.round(box.min.x) === utils.round(slice.min.x)){
		// горизонтальная балка
		boxes.push(new THREE.Box3(
			box.min,
			new THREE.Vector3(slice.max.x, slice.min.y, slice.max.z)
		));
		boxes.push(new THREE.Box3(
			new THREE.Vector3(slice.min.x, slice.max.y, slice.min.z),
			box.max,
		));
	} else {
		// тут, наверное, произошёл проёб из-за чисел с плавающей точкой
		// ну и пошло оно нахуй
		boxes.push(new THREE.Box3(box.min, slice.max));
		boxes.push(new THREE.Box3(slice.min, box.max));
	}
	
	return boxes;
}

function onPickup(obj, dragEngine){
    if(obj.userData.parentNode) {

        const tree = findBoxTree(obj.userData.parentNode.key);
        tree.unbindObj(obj);

        obj.userData.parentNode.children = [];
        renderBoxes3(dragEngine);
        

        obj.userData.parentNode = null;
        
    }
}

function onDrop(obj, dragEngine){
    const model = utils.getModelsGroup(obj);
    if (model && model.userData.scaleBox) {
        const slice = getObjSlice(obj);
        const parentBox = model.userData.scaleBox;
        const boxes = divideBox3BySlice(parentBox, slice);

        const pNodeAndTree = addToBoxesTreesList(parentBox, boxes);

        renderBoxes3(dragEngine);

        obj.userData.parentNode = pNodeAndTree.parentNode;
        pNodeAndTree.parentTree.bindObject(obj)

    }
}

function renderBoxes3(dragEngine){
    dragEngine.stage.clearBox3s();
    for(let tree of box3sTrees) {
        for(let node of tree.preOrderTraversal()){
            const box = node.key;
            if(node.isLeaf) dragEngine.stage.addBox3(box, true);
        }
    }
}

function onMove(obj, dragEngine){
    const interbox = dragEngine.cursorIntersectsBox3s();
    dragEngine.stage.returnObjOriginalScale(obj);
    if(interbox){
        
        dragEngine.snapObjectToBox3(obj, interbox)
        
        if (obj.userData.lockScale) {
            dragEngine.setPlaneNormal(dragEngine.pNormalVertical);
        };

        // onDrop(obj,dragEngine);
        // onPickup(obj,dragEngine);
    }
}

export function addListenersToPackableObject(obj, dragEngine){
    obj.userData.onPickup = ()=>{onPickup(obj, dragEngine)};
    obj.userData.onDrop = ()=>{onDrop(obj, dragEngine)};
    obj.userData.onMove = ()=>{onMove(obj,dragEngine)}
    obj.userData.isPackable = true;
}
export function addListenersToContainerObject(obj, dragEngine, box3){
    obj.userData.onMove = (oldpos, newpos)=>{
        const moved = new THREE.Vector3().subVectors(newpos,oldpos);
        
        const tree = findBoxTree(box3);
        const parentNode = tree.find(box3);
        
        utils.moveBox3(box3, moved);
        parentNode.children = [];
        renderBoxes3(dragEngine)
        try {
            for(let o of tree.bindedObjects){
                utils.moveObj(o, moved);
            }
        } catch (error) {
            console.error(error);
        }
    }
}
