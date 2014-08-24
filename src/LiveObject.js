// ---------------------------------------------------------------------------
var D = function(){
  Function.apply.call(console.log, console, arguments);
};

var each = require("./each");
var LiveValue = require("./LiveValue");
var ffBind = require("./ffBind");


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveObject = function(s, loParent){
	this.sName = s;
	this.alv = {};
	this.loParent = loParent;
	this.vloChildren = [];
	this.vlvListeners = [];

	if(loParent){
		loParent.vloChildren.push(this);
	}
	this.fRemakeAccessLayer();
};

// ---------------------------------------------------------------------------
LiveObject.prototype.floClone = function(s){
	D("CLONE CALLED?????");
	var lo = new LiveObject(s,this);
	this.vloChildren.push(lo);
	lo.fRemakeAccessLayer();
	return lo;
};


// ---------------------------------------------------------------------------
LiveObject.prototype.fDirty = function(){   
    this.vlvListeners.forEach(function(lvListener){
        lvListener.fDirty();
    });
};
 
// ---------------------------------------------------------------------------
LiveObject.prototype.fRemoveListener = function(lv){
    this.vlvListeners.splice(this.vlvListeners.indexOf(lv),1);
};
 
// ---------------------------------------------------------------------------
LiveObject.prototype.fAddListener = function(lv){
    this.vlvListeners.push(lv);
};
 
// ---------------------------------------------------------------------------
Object.defineProperty(
	LiveObject.prototype,"parent", {
		get: function(){return this.loParent;}
	}
);

// ---------------------------------------------------------------------------
LiveObject.prototype.fvslv = function(){
	var setVar = {};

	var lo = this;
	do{
		each(lo.alv, function(x,s){
			setVar[s]=true;
		});
		lo = lo.loParent;
	} while(lo);

	var vs=[];
	each(setVar, function(x,s){
		vs.push(s);
	});

	return vs;
}

// ---------------------------------------------------------------------------
LiveObject.prototype.faSimple = function(){
	var vslv = this.fvslv();
	var a={};
	var lo = this;
	vslv.forEach(function(slv){
		a[slv] = lo.fxGet(slv);
	});
	return a;
};


// ---------------------------------------------------------------------------
LiveObject.prototype.fRemakeAccessLayer = function(){
	delete this.aAccessLayer;
	this.aAccessLayer = {};

	var vslv = this.fvslv();

	var lo = this;
	vslv.forEach(function(s,n){
		Object.defineProperty(
			lo.aAccessLayer,	s, {
				get : function(){return lo.fxGet(s);},
				set : function(x){return lo.fSet(s,x);},
				configurable: true,
				enumerable: true,
				writeable : false
			}
		);
	});
	
	Object.freeze(this.aAccessLayer);

	each(this.vloChildren, function(lo){
		lo.fRemakeAccessLayer();
	});
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDefine = function(s,x,f){

	var bExistsLocal = this.fbExistsLocally(s);

	if (!bExistsLocal){
		var bExists = this.fbExists(s);
		this.alv[s] = new LiveValue(this.sName + ":" + s, x, false, f);
		if (!bExists){
			this.fRemakeAccessLayer();
		}
	}
	else{
		this.bMutable = false;
		this.fSet(s,x);
	}
};


// ---------------------------------------------------------------------------
LiveObject.prototype.fDefineMutable = function(s,x,f){

	var bExistsLocal = this.fbExistsLocally(s);
	if (!bExistsLocal){
		var bExists = this.fbExists(s);
		this.alv[s] = new LiveValue(this.sName + ":" + s, x, true, f);
		if (!bExists){
			this.fRemakeAccessLayer();
		}
	}
	else{
		this.bMutable = true;
		this.fSet(s,x);
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDelete = function(s){
	if (s in this.alv){
		delete this.alv[s];
		this.fRemakeAccessLayer();
		return;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fxGet = function(s){
	if (s in this.alv){
		return this.alv[s].fxGet();
	}
	if (this.loParent){
		return this.loParent.fxGet(s);
	}
	D("GET UNKNOWN VARIABLE ",this.sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.fSet = function(s,x){
	if (s in this.alv){
		this.alv[s].fSet(x);
		this.alv[s].fAddListener(this);
		return;
	}
	if (this.loParent){
		return this.loParent.fSet(s,x);
	}
	D("SET UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbExists = function(s){
	if (s in this.alv){
		return true;
	}
	if (this.loParent){
		return this.loParent.fbExists(s);
	}
	return false;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbExistsLocally = function(s){
	return s in this.alv;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbIsDirty = function(s){
	if (s in this.alv){
		return this.alv[s].bDirty;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};


module.exports = LiveObject;




