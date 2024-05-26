import {pointsHaveSameCoordinatesXZ} from './utils.js';

export class WallGraph {
	constructor(){
		this.walls = new Set();
	}
	add(wall){
		if (!this.has(wall)) {
			this.walls.add(wall);
			return true;
		}
		return false;
	}
	deleteRaw(wall) {
		return this.walls.delete(wall);
	}
	delete(wall) {
		for (let w of this.walls)
			if (this.wallsAreSame(w,wall))
				return this.walls.delete(w)
		return false;
	}
	purge(){
		this.walls = new Set();
	}
	has(wall){
		for (let w of this.walls)
			if (this.wallsAreSame(w,wall)) return true
		return false
	}
	wallsAreSame(w1,w2){
		return (
		pointsHaveSameCoordinatesXZ(w1.userData.startPoint, w2.userData.startPoint) && 
		pointsHaveSameCoordinatesXZ(w1.userData.endPoint, w2.userData.endPoint));
	}
	pointsAreSame(p1,p2){
		return (p1.x === p2.x && p1.z === p2.z);
	}
	wallIsConnectedToPoint(wall,point) {
		return (
		pointsHaveSameCoordinatesXZ(wall.userData.startPoint, point) ||
		pointsHaveSameCoordinatesXZ(wall.userData.endPoint, point));
	}
	getWallsByPoint(p){
		const walls = [];
		for (let w of this.walls) {
			if (this.wallIsConnectedToPoint(w,p)) walls.push(w);
		}
		return walls;
	}
}