// ---------------------------------------------------------------------------
var D = function(){
  Function.apply.call(console.log, console, arguments);
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveValue = function(s,x,bMutable){
	this.sName         = s+Math.floor(Math.random()*1000);
	this._x            = undefined;
	this.vlvDependsOn  = [];
	this.vlvListeners  = [];
	this._xCached      = null;
	this.bDirty        = false;
	this.bMutable      = !!bMutable;
	this.fSet(x);
};


// ---------------------------------------------------------------------------
LiveValue.prototype.fSet = function(x){
	// change function
//	D("SET",this.sName,x);

	if(this._x !== x){
		this.fDirty();
		this._x = x;
	}
}


// ---------------------------------------------------------------------------
LiveValue.prototype.fDirty = function(){	
	// if we weren't already dirty we are now 
	if (!this.bDirty){
		// mark dirtyness
		this.bDirty = true;

//		D("MARKING DIRTY", this.sName, this.vlvListeners.length);
		// so tell listensers
		var lv = this;
		this.vlvListeners.forEach(function(lvListener){
//			D("MARKING DIRTY", lv.sName, "--->",lvListener.sName);
			lvListener.fDirty();
		});

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
var klvListeners = [];
var cDepth = 0;
LiveValue.prototype.fxGet = function(){

	if(kvlvDependsCache.length && !this.bMutable){
		var c = kvlvDependsCache.length;
		kvlvDependsCache[c-1].push(this);
		this.fAddListener(klvListeners[c-1]);
	}

	if (this.bDirty){
		this.bDirty = false;

		if (typeof(this._x) === "function"){
			var vlvDependsNew = [];
			kvlvDependsCache.push(vlvDependsNew);
			klvListeners.push(this);
			this._xCached = this._x();
			klvListeners.pop();
			kvlvDependsCache.pop();

			// mark all new dependencies
			vlvDependsNew.forEach(function(vlDep){vlDep.nMark = 1;});

			// remove watches on any which are no longer dependencies
			// and mark prexisting dependencies
			var lv = this;
			this.vlvDependsOn.forEach(function(lvDep){
				if ( !lvDep.nMark ){
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
		}
		else{
			this._xCached = this._x;
		}	
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
