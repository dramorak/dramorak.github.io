function MyMatrix(seq){
	if(seq.length !== 6){
		throw new TypeError('Expecting 6 entries.');
	}

	this.m11 = seq[0];
	this.m12 = seq[1];
	this.m21 = seq[2];
	this.m22 = seq[3];
	this.m31 = seq[4];
	this.m32 = seq[5];

	this._matrix = seq;
}

MyMatrix.prototype.multiply(mat){
	if((mat instanceof myMatrix) === false){
		throw new TypeError('Expected a MyMatrix entry');
	}

	var a = this.m11 * mat.m11 + this.m21 * mat.m12;
	var b = this.m12 * mat.m11 + this.m22 * mat.m12;
	var c = this.m11 * mat.m21 + this.m21 * mat.m22;
	var d = this.m12 * mat.m21 + this.m22 * mat.m22;
	var e = this.m11 * mat.m31 + this.m21 * mat.m32 + this.m31;
	var f = this.m12 * mat.m31 + this.m22 * mat.m32 + this.m32;

	return new MyMatrix(a,b,c,d,e,f);
}