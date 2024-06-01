export class BoxesNode {
    constructor(key, value = key, parent = null){
        this.key = key;
        this.value = value;
        this.parent = parent;
        this.children = [];
    }
    get isLeaf(){
        return this.children.length === 0;
    }
    get hasChildren(){
        return !this.isLeaf;
    }

    // applyToAllChildren(node, cb,args){
    //     cb(node, args);
    //     for(let c of node.children){
    //         console.log(c);
    //         this.applyToAllChildren(c,cb,args);
    //     }
    // }
}