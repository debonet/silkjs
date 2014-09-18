// ---------------------------------------------------------------------------
var D = require("./fDebugOutput");
var each = require("./each");

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var nLiveValue = 0;
var LiveValue = function(s,x,bMutable,fCallbackDirty){
	this.sName          = s + "(lv" + nLiveValue + ")";
	nLiveValue++;

	this._x             = undefined;
	this.vlvDependsOn   = [];
	this.vlvListeners   = [];
	this._xCached       = null;
	this.bDirty         = false;
	if (bMutable){
		this.bMutable       = !!bMutable;
	}
	
	if (fCallbackDirty){
		this.fCallbackDirty = fCallbackDirty;
	}

	this.fSet(x);
};

// ---------------------------------------------------------------------------
LiveValue.prototype.fSet = function(x){
	// change function
	//	D("SET",this.sName,x);

	if(this._x !== x){
		this.fDirty();

		if (
			typeof(x) === "object" 
				&& (x.constructor.name === "Object" || x.constructor.name==="Array")
		){
			var lv = this;
			var LiveObject = require("./LiveObject");
			
			var lo = new LiveObject(this.sName + "[]", x instanceof Array);
			lo.fAddListener(this);
			each(x,function(xSub,n){
				lo.fDefine(n,xSub);
				lo.xlv[n].fAddListener(lo);
			});
			this._x = lo;
		}
		else{
			this._x = x;
		}
		
	}
};



// ---------------------------------------------------------------------------
LiveValue.prototype.fDirty = function(){	
	// if we weren't already dirty we are now 
	if (!this.bDirty){
//		D("MARKING DIRTY", this.sName, "----------------------------------", this.vlvListeners.length);

		if (this.fCallbackDirty){
			this.fCallbackDirty();
		}

		// mark dirtyness
		this.bDirty = true;

		// so tell listensers
		var lv = this;
		this.vlvListeners.forEach(function(lvListener){
//			D("     DIRTY CASCADE --->",lvListener.sName);
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
LiveValue.prototype.fRecompile = function(){
	if (!this._x.fRecompile){
		D("NO RECOMPILE AVAILABLE");
	}
	else{
		this._x = this._x.fRecompile(this._x);
		this.fDirty();
	}
};



// ---------------------------------------------------------------------------
var kvlvDependsCache=[];
var klvListeners = [];
var cDepth = 0;
var fTrackUsage=function(lv){
	if(kvlvDependsCache.length && !lv.bMutable){
		var c = kvlvDependsCache.length;
		kvlvDependsCache[c-1].push(lv);
		lv.fAddListener(klvListeners[c-1]);
	}
};

LiveValue.fTrackUsage = fTrackUsage;
LiveValue.prototype.fxGet = function(){
	fTrackUsage(this);

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

/*
		// asynchronously check arrays?
		if (this._x instanceof Array){
			var lv = this;
			var c= this._x.length;
			setTimeout(function(){
				if (c !== lv._x.length && !lv.bDirty){
					D("LENGTH CHANGE",c,lv._x);
					lv.fDirty();
				}
			},0);
		}
*/

	}
	return this._xCached;
};






module.exports = LiveValue;
