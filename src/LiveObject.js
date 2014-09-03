// ---------------------------------------------------------------------------
var D = require("./fDebugOutput");
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

	var lo = this;
	each(LiveObject.prototype, function(f,s){
		Object.defineProperty(lo,s,{
			value: f,
			enumerable: false,
			configurable: false
		});
	});

	each(this, function(f,s){
		Object.defineProperty(lo,s,{
			value: f,
			enumerable: false,
			configurable: false
		});
	});

	if(loParent){
		loParent.vloChildren.push(this);
		this.__proto__ = loParent;
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
		if (!(s in lo.alv)){
			throw("ILLEGAL VARIABLE ASSIGNMENT WITHOUT DEFINE " + lo.sName + "." + s);
		}
		if (lo.alv[s]._x instanceof LiveObject){
			lo.alv[s]._x.fCheckHonesty();
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
LiveObject.prototype.fDefine = function(s,x,f,bMutable){

	var bExistsLocal = this.fbExistsLocally(s);

	if (!bExistsLocal){
		this.alv[s] = new LiveValue(this.sName + ":" + s, x, bMutable, f);
		if (this.vlvListeners.length){
			this.fDirty();
			this.alv[s].fAddListener(this);
		}
		var lo=this;
		Object.defineProperty(
			lo,	s, {
				get : function(){return lo.alv[s].fxGet();},
				set : function(x){return lo.alv[s].fSet(x);},
				configurable: true,
				enumerable: true,
				writeable : false
			}
		);
	}
	else{
		this.alv[s].bMutable = bMutable;
		if (f){
			this.alv[s].fCallbackDirty = f;
		}
		this.alv[s].fSet(x);
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDefineMutable = function(s,x,f){
	this.fDefine(s,x,f,true);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fRecompile = function(s){
	if (s in this.alv){
		this.alv[s].fRecompile();
		return;
	}
	if (this.loParent){
		return this.loParent.fRecompile(s);
	}
	D("RECOMPILE UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDirtyVar = function(s){
	if (s in this.alv){
		this.alv[s].fDirty(s);
		return;
	}
	if (this.loParent){
		return this.loParent.fDirtyVar(s);
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fDelete = function(s){
	if (s in this.alv){
		delete this[s];
		delete this.alv[s];
		this.fDirty();
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
//		this.alv[s].fAddListener(this);
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




