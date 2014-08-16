// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveValue = function(s,x){
	this.sName         = s;
	this._x            = undefined;
	this.vlvDependsOn  = [];
	this.vlvListeners  = [];
	this._xCached      = null;
	this.bDirty        = false;
	this.fSet(x);
};


// ---------------------------------------------------------------------------
LiveValue.prototype.fSet = function(x){
	this.fDirty();
	// change function
//	D("SET",this.sName,x);

	this._x = x;
}


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
	if (this.vlvListeners.indexOf(lv)===-1){
		this.vlvListeners.push(lv);
	}
};


// ---------------------------------------------------------------------------
var kvlvDependsCache=[];

LiveValue.prototype.fxGet = function(){

//	D("GET",this.sName);

	if(kvlvDependsCache.length){
//		D("DEP",this.sName);
		kvlvDependsCache[0].push(this);
	}

	if (this.bDirty){
		if (typeof(this._x) === "function"){
			var vlvDependsNew = [];
			kvlvDependsCache.unshift(vlvDependsNew);
			this._xCached = this._x();
			kvlvDependsCache.shift();
	
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
			this.bRedefined = false;
		}
		else{
			this._xCached = this._x;
		}	
		this.bDirty = false;
	}
	return this._xCached;
};






// ---------------------------------------------------------------------------
/*
Object.defineProperty(
	LiveValue.prototype, "x", {
		get: LiveValue.prototype.fxGet,
		set: LiveValue.prototype.fSet,
	}
);


var LV = function(s,x){
	return new LiveValue(s,x);
};




var lvA = LV("a",5);
var lvB = LV("b",function(){return 2*lvA.x;});
var lvC = LV("c",function(){return "happy" + lvA.fxGet() +"--"+ lvB.x;});


D(lvC.fxGet());
lvA.x=20;
D(lvC.fxGet());
lvB.x=30;
D(lvC.fxGet());
lvB.fSet(function(){return 10*lvA.x ;});
D(lvC.fxGet());
lvA.x=3;
D(lvC.fxGet());

*/


module.exports = LiveValue;
