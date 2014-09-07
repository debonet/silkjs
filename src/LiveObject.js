// ---------------------------------------------------------------------------
var D = require("./fDebugOutput");
var each = require("./each");
var LiveValue = require("./LiveValue");
var ffBind = require("./ffBind");


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveObject = function(s, loParent, bArray){
	this.sName = s;
	this.loParent = loParent;
	this.vloChildren = [];
	this.vlvListeners = [];

	this.xlv = bArray ? [] : {};

	var lo = this;

	// add length pseudo-member if array
	if (bArray){
		var lo=this;
		Object.defineProperty(
			lo,	"length", {
				get : function(){return lo.xlv.length},
				configurable: false,
				enumerable: false,
				writeable : false
			}
		);
	}

	// freeze members
	each(this, function(f,s){
		Object.defineProperty(lo,s,{
			value: f,
			enumerable: false,
			configurable: false
		});
	});

	// set up scoping hierarchy 
	if(loParent){
		loParent.vloChildren.push(this);
		this.__proto__ = loParent;
	}
};


LiveObject.prototype.push = function(x){
	D("PUSHME",x);
	this.fDirty();
	this.xlv.push(new LiveValue(this.sName+"[]",x));
	this.fAddAccess(this.xlv.length-1);
};

LiveObject.prototype.pop = function(){
	this.fDirty();
	delete this[this.xlv.length-1];
	return this.xlv.pop().fxGet();
};

LiveObject.prototype.shift = function(x){
	this.fDirty();
	this.xlv.shift(new LiveValue(this.sName+"[]",x));
	this.fAddAccess(this.xlv.length-1);
};

LiveObject.prototype.unshift = function(){
	this.fDirty();
	delete this[this.xlv.length-1];
	return this.xlv.unshift().fxGet();
};

LiveObject.prototype.sort = function(f){
	this.fDirty();
	this.xlv.sort(f);
};

LiveObject.prototype.reverse = function(){
	this.fDirty();
	this.xlv.reverse();
};

LiveObject.prototype.splice = function(){
	this.fDirty();
	var cOrig = this.xlv.length;
	Array.prototype.splice(this.xlv,arguments);
	var cNew = this.xlv.length;

	var n;
	for (n=cNew; n<cOrig; n++){
		delete this[n];
	}
	for (var n=cOrig; n<cNew; n++){
		this.fAddAccess(n);
	}
};


// ---------------------------------------------------------------------------
LiveObject.prototype.fDirty = function(){   
	D("DIRTYOBJ",this.sName);
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
LiveObject.prototype.fCheckHonesty = function(){
	var lo=this;
	each(Object.keys(this), function(s){
		if (!(s in lo.xlv)){
			throw("ILLEGAL VARIABLE ASSIGNMENT WITHOUT DEFINE " + lo.sName + "." + s);
		}
		if (lo.xlv[s]._x instanceof LiveObject){
			lo.xlv[s]._x.fCheckHonesty();
		}
	});

	each(this.vloChildren, function(lo){
		lo.fCheckHonesty();
	});
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fvslv = function(){
	var setVar = {};

	var lo = this;
	do{
		each(lo.xlv, function(x,s){
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

LiveObject.prototype.fAddAccess = function(s){
	if (this.vlvListeners.length){
		this.fDirty();
		this.xlv[s].fAddListener(this);
	}
	var lo=this;
	Object.defineProperty(
		lo,	s, {
			get : function(){return lo.xlv[s].fxGet();},
			set : function(x){return lo.xlv[s].fSet(x);},
			configurable: true,
			enumerable: true,
			writeable : false
		}
	);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDefine = function(s,x,f,bMutable){

	var bExistsLocal = this.fbExistsLocally(s);

	if (!bExistsLocal){
		this.xlv[s] = new LiveValue(this.sName + ":" + s, x, bMutable, f);
		this.fAddAccess(s);
	}
	else{
		this.xlv[s].bMutable = bMutable;
		if (f){
			this.xlv[s].fCallbackDirty = f;
		}
		this.xlv[s].fSet(x);
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDefineMutable = function(s,x,f){
	this.fDefine(s,x,f,true);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fRecompile = function(s){
	if (s in this.xlv){
		this.xlv[s].fRecompile();
		return;
	}
	if (this.loParent){
		return this.loParent.fRecompile(s);
	}
	D("RECOMPILE UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDirtyVar = function(s){
	if (s in this.xlv){
		this.xlv[s].fDirty(s);
		return;
	}
	if (this.loParent){
		return this.loParent.fDirtyVar(s);
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDelete = function(s){
	if (s in this.xlv){
		delete this[s];
		delete this.xlv[s];
		this.fDirty();
		return;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fxGet = function(s){
	if (s in this.xlv){
		return this.xlv[s].fxGet();
	}
	if (this.loParent){
		return this.loParent.fxGet(s);
	}
	D("GET UNKNOWN VARIABLE ",this.sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.fSet = function(s,x){
	if (s in this.xlv){
		this.xlv[s].fSet(x);
//		this.xlv[s].fAddListener(this);
		return;
	}
	if (this.loParent){
		return this.loParent.fSet(s,x);
	}
	D("SET UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbExists = function(s){
	if (s in this.xlv){
		return true;
	}
	if (this.loParent){
		return this.loParent.fbExists(s);
	}
	return false;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbExistsLocally = function(s){
	return s in this.xlv;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbIsDirty = function(s){
	if (s in this.xlv){
		return this.xlv[s].bDirty;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};


// freeze class methods
each(LiveObject.prototype, function(f,s){
	Object.defineProperty(LiveObject.prototype,s,{
		value: f,
		enumerable: false,
		configurable: false
	});
});


module.exports = LiveObject;




