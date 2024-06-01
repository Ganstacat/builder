import {BoxesNode} from './BoxesNode.js';
export class BoxesTree {
    constructor(key, value = key){
        this.root = new BoxesNode(key, value);
        this.bindedObjects = [];
    }
    *preOrderTraversal(node = this.root){
        yield node;
        if(node.children.length)
            for(let child of node.children)
                yield* this.preOrderTraversal(child);
    }
    *postOrderTraversal(node = this.root){
        if(node.children.length)
            for(let child of node.children)
                yield* this.postOrderTraversal(child);

        yield node;
    }

    insert(parentNodeKey, key, value = key){
        for(let node of this.preOrderTraversal()){
            if(node.key === parentNodeKey) {
                node.children.push(new BoxesNode(key,value,node));
                return true;
            }
        }
        return false;
    }
    remove(key){
        for(let node of this.preOrderTraversal()){
            const filtered = node.children.filter(c=> c.key !== key);
            if(filtered.length !== node.children.length) {
                node.children = filtered;
                return true;
            }
        }
        return false;
    }
    find(key){
        for(let node of this.preOrderTraversal()){
            if(node.key === key) return node;
        }
        return undefined;
    }

    getRoot(){
        return this.root;
    }

    bindObject(obj){
        this.bindedObjects.push(obj);
    }
    unbindObj(obj){
        this.bindedObjects = this.bindedObjects.filter(o=> { return o !== obj });
    }
}