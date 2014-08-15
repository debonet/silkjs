
// ---------------------------------------------------------------------------
var alv = {};

// ---------------------------------------------------------------------------
var flv = function(id){
	if (!(id in alv)){
		alv[id] = new LiveVar();
	}
	return alv[id];
};

// ---------------------------------------------------------------------------
var fLVSet(id,x,vidDep){
	flv(id).fSet(x,vidDep);
};

// ---------------------------------------------------------------------------
var fxLVGet(id){
	return flv(id).fxGet();
};


// ---------------------------------------------------------------------------
var LiveVar = function(){
	this.setidListeners = new StringSet();
	this.setidDependsOn = new StringSet();
	this.x = x;
	this.xCached = x;
	this.bDirty = false;
};

// ---------------------------------------------------------------------------
LiveVar.prototype.fSet(x,vidDep){
	if (!this.bDirty){
		this.setidListeners.each(function(idListener){
			flv(idListener).fDirty();
		});

		this.bDirty = true;
	}

	lv.x = x;

	// correct listeners
	setidNowDependsOn = new StringSet(vidDep);

	var setidNoLongerDependsOn = this.setidDependsOn.fsetidDifference(setidNowDependsOn);
	setidNoLongerDependsOn.each(function(idDep){
		flv(idDep).fRemoveListener(id);
	});

	var setidNewlyDependsOn = setidNowDependsOn.fsetidDifference(this.setidDependsOn);
	setidNowDependsOn.each(function(idDep){
		flv(idDep).fAddListener(id);
	});

	this.setidDependsOn = setidNowDependsOn;
};


// ---------------------------------------------------------------------------
LiveVar.prototype.fDirty(){
	this.bDirty = true;
};

// ---------------------------------------------------------------------------
LiveVar.prototype.fRemoveListener(id){
	this.setidListeners.fRemove(id);
};

// ---------------------------------------------------------------------------
LiveVar.prototype.fAddListener(id){
	this.setidListeners.fAdd(id);
};


// ---------------------------------------------------------------------------
LiveVar.prototype.fxGet(){
	if (this.bDirty){
		this.xCached = this.x();
		this.bDirty = false;
	}

	return this.xCached;
};


// ---------------------------------------------------------------------------
SetVar('x', 5,[]);

SetVar('y', function(){return GetVar('x');}, ['x']);

 
