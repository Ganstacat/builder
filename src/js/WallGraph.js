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
	has(wall){
		for (let w of this.walls)
			if (this.wallsAreSame(w,wall)) return true
		return false
	}
	wallsAreSame(w1,w2){
		return (this.pointsAreSame(w1.userData.startPoint, w2.userData.startPoint) && this.pointsAreSame(w1.userData.endPoint, w2.userData.endPoint));
	}
	pointsAreSame(p1,p2){
		return (p1.x === p2.x && p1.z === p2.z);
	}
	pointsEqual(wall,point) {
		return (this.pointsAreSame(wall.userData.startPoint, point) || this.pointsAreSame(wall.userData.endPoint, point));
	}
	getWallsByPoint(p){
		const walls = [];
		for (let w of this.walls) {
			if (this.pointsEqual(w,p)) walls.push(w);
		}
		return walls;
	}
}