// ---------------------------------------------------------------------------
var D = require("./fDebugOutput");
var each = require("./each");
var LiveValue = require("./LiveValue");
var ffBind = require("./ffBind");


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var nLiveObject = 0;
var LiveObject = function LiveObject(s, bArray, __loParent){
	this.__sName = s + '(lo'+nLiveObject + ")";
	nLiveObject++;

	this.__loParent = __loParent;
	this.__vloChildren = [];

	this.__xlv = bArray ? [] : {};

	var lo = this;

	// freeze members
	each(this, function(f,s){
		Object.defineProperty(lo,s,{
			value: f,
			enumerable: false,
			configurable: false
		});
	});


	// add length pseudo-member if array
	if (bArray){
		this.__xlv['__reallength'] = new LiveValue(this.__sName + ":__reallength", function(){
			return lo.__xlv.length;
		});
		this.__fAddAccess('__reallength',true);

		Object.defineProperty(
			lo,	"length", {
				get : function(){
					return lo.__reallength;
					return lo.__xlv['__reallength'].fxGet();
				},
				configurable: false,
				enumerable: false,
				writeable : false
			}
		);
	}


	// set up scoping hierarchy 
	if(__loParent){
		__loParent.__vloChildren.push(this);
		this.__proto__ = __loParent;
	}
};


LiveObject.prototype.push = function(x){
//		D("TRACKUSAGE");LiveValue.fTrackUsage(this);
	var c=this.__xlv.length;
	this.__xlv.push(new LiveValue(this.__sName+":" + c,x));
	this.__fAddAccess(c);
	this.__fDirty();
};

LiveObject.prototype.pop = function(){
	this.__fDirty();
	delete this[this.__xlv.length-1];
	return this.__xlv.pop().fxGet();
};

LiveObject.prototype.shift = function(x){
	this.__fDirty();
	this.__xlv.shift(new LiveValue(this.__sName+"[shift]",x));
	this.__fAddAccess(this.__xlv.length-1);
};

LiveObject.prototype.unshift = function(){
	this.__fDirty();
	delete this[this.__xlv.length-1];
	return this.__xlv.unshift().fxGet();
};

LiveObject.prototype.sort = function(f){
	this.__fDirty();
	this.__xlv.sort(f);
};

LiveObject.prototype.reverse = function(){
	this.__fDirty();
	this.__xlv.reverse();
};

LiveObject.prototype.splice = function(){
	this.__fDirty();
	var cOrig = this.__xlv.length;
	Array.prototype.splice(this.__xlv,arguments);
	var cNew = this.__xlv.length;

	var n;
	for (n=cNew; n<cOrig; n++){
		delete this[n];
	}
	for (var n=cOrig; n<cNew; n++){
		this.__fAddAccess(n);
	}
};


// ---------------------------------------------------------------------------
Object.defineProperty(
	LiveObject.prototype,"parent", {
		get: function(){return this.__loParent;}
	}
);


// ---------------------------------------------------------------------------
LiveObject.prototype.__fDirty = function(){   
	if (this.__xlv.constructor === Array){
		this.__xlv['__reallength'].fDirty();
	}
};
 
// ---------------------------------------------------------------------------
LiveObject.prototype.__fCheckHonesty = function(){
	var lo=this;
	each(Object.keys(this), function(s){
		if (!(s in lo.__xlv)){
			throw("ILLEGAL VARIABLE ASSIGNMENT WITHOUT DEFINE " + lo.__sName + "." + s);
		}
		if (lo.__xlv[s]._x instanceof LiveObject){
			lo.__xlv[s]._x.__fCheckHonesty();
		}
	});

	each(this.__vloChildren, function(lo){
		lo.__fCheckHonesty();
	});
};



// ---------------------------------------------------------------------------
LiveObject.prototype.__fAddAccess = function(s,bHide){
	var lo=this;
	Object.defineProperty(
		lo,	s, {
			get : function(){return lo.__xlv[s].fxGet();},
			set : function(x){return lo.__xlv[s].fSet(x);},
			configurable: true,
			enumerable: !bHide,
			writeable : false
		}
	);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDefine = function(s,x,f,bMutable){

	var bExistsLocal = this.__fbExistsLocally(s);

	if (!bExistsLocal){
		this.__xlv[s] = new LiveValue(this.__sName + ":" + s, x, bMutable, f);
		this.__fAddAccess(s);
		this.__fDirty();
	}
	else{
		this.__xlv[s].bMutable = bMutable;
		if (f){
			this.__xlv[s].fCallbackDirty = f;
		}
		this.__xlv[s].fSet(x);
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDefineMutable = function(s,x,f){
	this.__fDefine(s,x,f,true);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fRecompile = function(s){
	if (s in this.__xlv){
		this.__xlv[s].fRecompile();
		return;
	}
	if (this.__loParent){
		return this.__loParent.__fRecompile(s);
	}
	D("RECOMPILE UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDirtyVar = function(s){
	if (s in this.__xlv){
		this.__xlv[s].fDirty(s);
		return;
	}
	if (this.__loParent){
		return this.__loParent.__fDirtyVar(s);
	}
	D("UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDelete = function(s){
	if (s in this.__xlv){
		delete this[s];
		delete this.__xlv[s];
		this.__fDirty();
		return;
	}
	D("UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fxGet = function(s){
	if (s in this.__xlv){
//		D("TRACKUSAGE");LiveValue.__fTrackUsage(this);
		return this.__xlv[s].fxGet();
	}
	if (this.__loParent){
		return this.__loParent.__fxGet(s);
	}
	D("GET UNKNOWN VARIABLE ",this.__sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.__fSet = function(s,x){
	if (s in this.__xlv){
//		D("TRACKUSAGE");LiveValue.__fTrackUsage(this);
		this.__xlv[s].fSet(x);
//		this.__xlv[s].fAddListener(this);
//		D("NOADDLISTENER",this.__sName);
		return;
	}
	if (this.__loParent){
		return this.__loParent.__fSet(s,x);
	}
	D("SET UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fbExists = function(s){
	if (s in this.__xlv){
		return true;
	}
	if (this.__loParent){
		return this.__loParent.__fbExists(s);
	}
	return false;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fbExistsLocally = function(s){
	return s in this.__xlv;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fbIsDirty = function(s){
	if (s in this.__xlv){
		return this.__xlv[s].bDirty;
	}
	D("UNKNOWN VARIABLE ",this.__sName,s);
};




// add .*var variants so that _.defvar() will work
LiveObject.prototype.defvar = LiveObject.prototype.__fDefine;
LiveObject.prototype.recompilevar = LiveObject.prototype.__fRecompile;
LiveObject.prototype.defun = function(s,x){
	return this.__fDefine(s,function(){return x;});
};

LiveObject.prototype.defmutable = LiveObject.prototype.__fDefineMutable;
LiveObject.prototype.checkvar = LiveObject.prototype.__fbExists;
LiveObject.prototype.localvar = LiveObject.prototype.__fbExistsLocally;
LiveObject.prototype.delvar = LiveObject.prototype.__fDelete;
LiveObject.prototype.dirtyvar = LiveObject.prototype.__fDirtyVar;
LiveObject.prototype.getvar = LiveObject.prototype.__fxGet;
LiveObject.prototype.setvar = LiveObject.prototype.__fSet;


// freeze class methods
each(LiveObject.prototype, function(f,s){
	Object.defineProperty(LiveObject.prototype,s,{
		value: f,
		enumerable: false,
		configurable: false
	});
});


module.exports = LiveObject;




