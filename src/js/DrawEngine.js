import {WallGraph} from './WallGraph.js';

export class DrawEngine {
	constructor(controller){
		this.controller = controller;
		this.wallGraph = new WallGraph();

		this.inter = new THREE.Vector3();
		this.start;
		this.end;

		this.nodes = [];
		this.nodesList = [];
		this.polys = [];
		this.walls = [];
		this.anchors = [];

		this.angleStart;
		this.angle;
		this.height = 0.0001;
	}
	removeFloor(){
		for (let p of this.polys) {
			p.removeFromParent();
		}
		this.polys=[];
		this.height = 0.0001;
	}
	changeFloor(oldP, newP){
		for(let i = 0; i < this.nodesList.length; i++){
			for (let j = 0; j < this.nodesList[i].length; j++){
				if (this.wallGraph.pointsEqual(this.nodesList[i][j],oldP)) {
					this.nodesList[i][j] = newP;
				}
			}
		}
	}
	redrawFloor(){
		this.removeFloor();
		for(let nodes of this.nodesList) {
			const poly = this.createPolygon(nodes);
			this.controller.addObjectToCurrentStage(poly);
			this.polys.push(poly);
		}
	}
	movePoint(p, newPos) {
		const p_copy = p.clone();
		p.addVectors(p, newPos);
		const connectedWalls = this.wallGraph.getWallsByPoint(p_copy);
		const startPoints = [];
		const endPoints = [];
		for(let w of connectedWalls) {
			endPoints.push(p);
			if(this.wallGraph.pointsEqual(w.userData.startPoint, p_copy)) {
				startPoints.push(w.userData.endPoint);
			} else {
				startPoints.push(w.userData.startPoint);
			}
			this.controller.removeObjectFromCurrentStage(w);
			this.wallGraph.deleteRaw(w);
		}
		
		for (let i = 0; i < startPoints.length; i++) {
			const wall = this.makeWallBetweenTwoPoints(startPoints[i], endPoints[i], box2MultiMaterial);
			
			const added = this.wallGraph.add(wall);
			if(added)
				this.controller.addObjectToCurrentStage(wall,true,false,false);
		}
		
		this.changeFloor(p_copy, p);
		this.redrawFloor();
	}
	
	makeWallBetweenTwoPoints(start, end, material) {
		const dist = start.distanceTo(end);
		const boxgeo = new THREE.BoxGeometry(0.2,2,dist);
		
		const mat = [];
		utils.applyToArrayOrValue(material, (m)=>{
			mat.push(m.clone());
		});
	?	const mesh = utils.createMesh(boxgeo, mat);
		
		mesh.position.set(
			(start.x + end.x)/2,
			1,
			(start.z + end.z)/2
		);
		
		mesh.userData.startPoint = start;
		mesh.userData.endPoint = end
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
		mesh.lookAt(end);
		return mesh;
	}

	makeCylinderAtPoint(point) {
		const mesh = new THREE.Mesh(
			new THREE.CylinderGeometry(0.1,0.1,2), 
			new THREE.MeshStandardMaterial({
				color: 'gray'
			})
		);
		
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
	
}