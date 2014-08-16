var nsUtil = require("util");

// ---------------------------------------------------------------------------
var alv = {};

var flv = function(id){
	if (!(id in alv)){
		var lv=new LiveValue();
		alv[id]=lv;
	}
	return alv[id];
};
var flvSet = function(id,x,vlvDependsOn){
	var lv = flv(id);
	lv.fSet(x,vlvDependsOn);
	return lv;
};
var fxLVGet = function(id){
	return flv(id).fxGet(id);
};

// ---------------------------------------------------------------------------
var LiveValue = function(x,vlvDependsOn){
	this.x            = undefined;
	this.vlvDependsOn = [];
	this.vlvListeners = [];
	this.xCached      = null;
	this.bDirty       = false;
	this.fSet(x,vlvDependsOn);
};


// ---------------------------------------------------------------------------
LiveValue.prototype.fSet = function(x,vlvDependsNew){
	vlvDependsNew = vlvDependsNew || [];

	this.fDirty();

	// change function
	this.x = x;

	// correct listeners

	// mark all new dependencies
	vlvDependsNew.forEach(function(vlDep){vlDep.nMark = 1;});

	// remove watches on any which are no longer dependencies
	// and mark prexisting dependencies
	var lv = this;
	this.vlvDependsOn.forEach(function(lvDep){
		if ( lvDep.nMark !==1 ){
			lvDep.fRemoveListener(lv);
		}
		else {
			lvDep.nMark = 2;
		}
	});

	// add watches on any new dependencies
	// and remove all marks
	vlvDependsNew.forEach(function(vlDep){
		if(vlDep.nMark !== 2){
			vlDep.fAddListener(lv);
		}
		delete vlDep.nMark;
	});

	// update the dependency list
	this.vlvDependsOn = vlvDependsNew;
};


// ---------------------------------------------------------------------------
LiveValue.prototype.fDirty = function(){	
	// if we weren't already dirty we are now 
	if (!this.bDirty){
	
		// so tell listensers
		this.vlvListeners.forEach(function(lvListener){
			lvListener.fDirty();
		});

		// mark dirtyness
		this.bDirty = true;
	}
};

// ---------------------------------------------------------------------------
LiveValue.prototype.fRemoveListener = function(lv){
	this.vlvListeners.splice(this.vlvListeners.indexOf(lv),1);
};

// ---------------------------------------------------------------------------
LiveValue.prototype.fAddListener = function(lv){
	this.vlvListeners.push(lv);
};


// ---------------------------------------------------------------------------
LiveValue.prototype.fxGet = function(){
	if (this.bDirty){
		if (typeof(this.x) === "function"){
			this.xCached = this.x();
		}	
		else{
			this.xCached = this.x;
		}	
		this.bDirty = false;
	}

	return this.xCached;
};

/*

flvSet("a",5);
flvSet("b",function(){return fxLVGet("a");},[flv("a")]);
console.log(fxLVGet("b"));

flvSet("a",6);
console.log(fxLVGet("b"));

flvSet("a",function(){return fxLVGet("c");},[flv("c")]);
console.log(fxLVGet("b"));

flvSet("c",7);
//console.log(nsUtil.inspect(flv("a"),{depth:10}));

console.log(fxLVGet("b"));



lvA = new LiveValue(5);
lvB = new LiveValue(function(){return lvA.fxGet();},[lvA]);
console.log(lvB.fxGet());

lvA.fSet(6);
console.log(lvB.fxGet());

lvC = new LiveValue();
lvA.fSet(function(){return lvC.fxGet();},[lvC]);
console.log(lvB.fxGet());

lvC.fSet(7);
console.log(lvB.fxGet());

//console.log(nsUtil.inspect(lvA));



*/

var LV = function(x,vlv){
	return new LiveValue(x,vlv);
};


var lvA = LV(5);
var lvB = LV(6);
var lvC = LV(function(){return lvA.fxGet() + lvB.fxGet();}, [lvA, lvB]);
console.log(lvC.fxGet());
lvB.fSet(20);
console.log(lvC.fxGet());

var lvD = LV("happy");
var lvE = LV(function(){return lvD.fxGet() + lvC.fxGet();}, [lvD, lvC]);
console.log(lvE.fxGet());

lvB.fSet(2);
console.log(lvE.fxGet());
