import {WallGraph} from './WallGraph.js';
import * as utils from './utils.js';
import * as THREE from 'three'

export class DrawEngine {
	#wallpaperMaterialKey = 'wallpaperTwo';
	#notAllowedMaterialKey = 'redLine';
	#allowedMaterialKey = 'greenLine';
	#roundCornerMaterialKey = 'wallRoundCorner';
	
	constructor(dragEngine, materialManager){
		this.dragEngine = dragEngine;
		this.materialManager = materialManager;
		
		this.#initialize();
		
		this.drawing = false;
		
		this.wallMaterial = this.materialManager.getMaterial(this.#wallpaperMaterialKey);
		this.cylinderMaterial = this.materialManager.getMaterial(this.#roundCornerMaterialKey);
		
		this.lineMaterialBad = this.materialManager.getMaterial(this.#notAllowedMaterialKey);
		
		this.lineMaterialGood =this.materialManager.getMaterial(this.#allowedMaterialKey);	
		
	}
	#initialize(){
		this.nodes = [];
		this.nodesList = [];
		this.polys = [];
		this.walls = [];
		this.corners = [];
		this.wallGraph = new WallGraph();

		this.inter = new THREE.Vector3();
		this.start;
		this.end;


		this.line;
		
		this.angleStart;
		this.angle;
		this.height = 0.0001;
		
	}
	setDrawing(bool){
		this.drawing = bool;
	}
	#removeFloor(){
		for (let p of this.polys) {
			p.removeFromParent();
		}
		this.polys=[];
		this.height = 0.0001;
	}
	#changeFloor(oldP, newP){
		for(let i = 0; i < this.nodesList.length; i++){
			for (let j = 0; j < this.nodesList[i].length; j++){
				if (utils.pointsHaveSameCoordinatesXZ(this.nodesList[i][j],oldP)) {
					this.nodesList[i][j] = newP;
				}
			}
		}
	}
	redrawFloor(){
		this.#removeFloor();
		for(let nodes of this.nodesList) {
			const poly = this.createPolygon(nodes);
			this.stage.addObject(poly);
			this.polys.push(poly);
		}
	}
	#removeCorners(){
		for (let c of this.corners)
			c.removeFromParent();
	}
	clearWalls(){
		this.#removeFloor();
		this.#removeCorners();
		this.#initialize();
	}
	movePoint(p, newPos) {
		const p_copy = p.clone();
		p.addVectors(p, newPos);
		
		for(let c of this.corners){
			const pos = c.position;
			if (utils.pointsHaveSameCoordinatesXZ(p_copy,pos)) {
				c.position.set(p.x, p.y, p.z);
			}
		}
		
		const connectedWalls = this.wallGraph.getWallsByPoint(p_copy);
		const startPoints = [];
		const endPoints = [];
		for(let w of connectedWalls) {
			endPoints.push(p);
			if(utils.pointsHaveSameCoordinatesXZ(w.userData.startPoint, p_copy)) {
				startPoints.push(w.userData.endPoint);
			} else {
				startPoints.push(w.userData.startPoint);
			}
			this.stage.removeObject(w);
			this.wallGraph.deleteRaw(w);
		}
		
		for (let i = 0; i < startPoints.length; i++) {
			const wall = this.makeWallBetweenTwoPoints(startPoints[i], endPoints[i], this.wallMaterial);
			
			const added = this.wallGraph.add(wall);
			if(added)
				this.stage.addObject(wall,true,true,true);
		}
		
		this.#changeFloor(p_copy, p);
		this.redrawFloor();
	}
	
	makeWallBetweenTwoPoints(start, end, material) {
		const dist = start.distanceTo(end);
		const boxgeo = new THREE.BoxGeometry(0.2,2,dist);
		
		const mat = [];
		utils.applyToArrayOrValue(material, (m)=>{
			mat.push(m.clone());
		});
		const mesh = utils.createMesh(boxgeo, mat);
		
		mesh.position.set(
			(start.x + end.x)/2,
			1,
			(start.z + end.z)/2
		);
		
		mesh.userData.startPoint = start;
		mesh.userData.endPoint = end
		mesh.userData.isWall = true;
		mesh.userData.isNotAffectedByCollision = true;
		const self = this;
		mesh.userData.onMove = (sp, ep)=>{
			// посчитать, как сдвинулась стена, то есть вектор
			// от sp до ep
			const moved = new THREE.Vector3().subVectors(ep,sp);
			
			// передвинуть startPoint и endPoint в этом же направлении, получив sp2 и ep2
			const sp2 = new THREE.Vector3().addVectors(mesh.userData.startPoint, moved);
			const ep2 = new THREE.Vector3().addVectors(mesh.userData.endPoint, moved);
			
			// вызвать movePoint(startPoint, sp2), movePoint(endPoint.ep2)
			self.movePoint(mesh.userData.startPoint, moved);
			self.movePoint(mesh.userData.endPoint, moved);
			
			// обновить startPoint = sp2 и endPoint = ep2
			mesh.userData.startPoint = sp2;
			mesh.userData.endPoint = ep2;
		}
		mesh.children[0].lookAt(end);
		return mesh;
	}

	makeCylinderAtPoint(point, material) {
		for(let c of this.corners){
			const p = c.position;
			if (utils.pointsHaveSameCoordinatesXZ(p, point)) {
				return;
			}
		}
		
		const mat = [];
		utils.applyToArrayOrValue(material, (m)=>{
			mat.push(m.clone());
		});
		
		const mesh = utils.createMesh(
			new THREE.CylinderGeometry(0.1,0.1,2.01), 
			mat
		);
		this.corners.push(mesh);
		mesh.userData.isNotAffectedByCollision = true;
		
		mesh.position.set(point.x, 1, point.z);
		return mesh;
	}
	
	createPolygon(points) {
		if (points.length < 3) return;
		const shape = new THREE.Shape();
		shape.moveTo(points[0].x, points[0].z);
		for (let i = 1; i < points.length; i++) {
			shape.lineTo(points[i].x, points[i].z);
		}
		const geometry = new THREE.ShapeGeometry(shape);
		const material = new THREE.MeshBasicMaterial({
			color: "Beige", 
			side: THREE.DoubleSide
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.rotation.x = 0.5*Math.PI;
		
		mesh.position.y += this.height;
		this.height+= 0.0001;
		return mesh;
	}
	
	addEventListenersToStage(stage){
		const self = this;
		console.log(this.stage);
		this.stage.renderer.domElement.addEventListener("click", ()=>{
			self.#onClick();
		});
		this.stage.renderer.domElement.addEventListener('pointermove', ()=>{self.#onPointerMove()});
	}
	#onPointerMove(){
		if(this.line) this.stage.removeObject(this.line);
		if (!this.drawing) return;

		
		this.stage.getRaycaster().ray.intersectPlane(
			this.dragEngine.getDraggingPlane(),
			this.inter
		);

		this.end = new THREE.Vector3(this.inter.x,1,this.inter.z);
		utils.snapPoint(this.end);

		if (!this.start) return;


		
		for (let c of this.corners){
			const p = c.position;
			if(utils.arePointsNearXZ(this.end, p)){
				this.end.x = p.x;
				this.end.z = p.z;
			}		
		}
		
		//adhoc
		var material = this.lineMaterialGood;
		
		if (this.angleStart){
			this.angle = utils.angleBetweenSegmentsXZ(this.angleStart, this.start, this.end);
			if (this.angle < 45) material = this.lineMaterialBad;
		}

		const geometry = new THREE.BufferGeometry().setFromPoints([this.start, this.end]);
		this.line = new THREE.Line(geometry, material);
		this.stage.addObject(this.line);

	}
	#onClick(){
		if (!this.drawing) return;
		
		if(!this.start) {
			
			for (let c of this.corners){
				const p = c.position;
				if(utils.arePointsNearXZ(this.end, p)){
					this.end.x = p.x;
					this.end.z = p.z;
				}		
			}
			this.start = this.end;
			
			const cylinder = this.makeCylinderAtPoint(this.end, this.cylinderMaterial);
			
			if (cylinder)
				this.stage.addObject(cylinder, true);
			
			
		} else {
			this.angleStart = this.start;
			
			const wall = this.makeWallBetweenTwoPoints(this.start, this.end, this.wallMaterial);
			
			const added = this.wallGraph.add(wall);
			if(added)
				this.stage.addObject(wall,true,true,true);

			this.walls.push(wall);
			
			const cylinder = this.makeCylinderAtPoint(this.end, this.cylinderMaterial);
			
			if (cylinder)
				this.stage.addObject(cylinder, true);
			

			this.nodes.push(this.start);

			let closed = false;
			
			if (utils.pointsHaveSameCoordinatesXZ(this.nodes[0], this.end)) closed = true;

			
			if (closed) {
				// nodes.push(end);
				const poly = this.createPolygon(this.nodes);
				this.stage.addObject(poly);
				this.polys.push(poly);
				this.nodesList.push(this.nodes);
				
				this.start = null;
				this.walls = [];
				this.nodes = [];
			} else {			
				this.start = this.end;
			}
		}
	}
	/**
		Устанавливает сцену, на которой будут перемещаться модели.
	*/
	setStage(stage) {
		this.stage = stage;
	}
}