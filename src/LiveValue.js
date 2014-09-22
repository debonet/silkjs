// ---------------------------------------------------------------------------
var D = require("./fDebugOutput");
var each = require("./each");

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var nLiveValue = 0;
var LiveValue = function(s,x,bMutable,fCallbackDirty){
	this.sName          = s + "(lv" + nLiveValue + ")";
	nLiveValue++;

	this.xValue             = undefined;
	this.vlvDependsOn   = [];
	this.vlvListeners   = [];
	this.xValueCached       = null;
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

	if(this.xValue !== x){
		this.fDirty();

		if (
			typeof(x) === "object" 
				&& (x.constructor.name === "Object" || x.constructor.name==="Array")
		){
			var lv = this;
			var LiveObject = require("./LiveObject");
			
			var lo = new LiveObject(this.sName + "[]", x instanceof Array);
			each(x,function(xSub,n){
				lo.__fDefine(n,xSub);
				lo.__xlv[n].fAddListener(lv);
			});
			if (x instanceof Array){
				lo.__xlv['__reallength'].fAddListener(lv);
			}
			this.xValue = lo;
		}
		else{
			this.xValue = x;
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
	if (!this.xValue.fRecompile){
		D("NO RECOMPILE AVAILABLE");
	}
	else{
		this.xValue = this.xValue.fRecompile(this.xValue);
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

		if (typeof(this.xValue) === "function"){
			var vlvDependsNew = [];
			kvlvDependsCache.push(vlvDependsNew);
			klvListeners.push(this);
			this.xValueCached = this.xValue();
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
			this.xValueCached = this.xValue;
		}	
	}
	return this.xValueCached;
};






module.exports = LiveValue;
