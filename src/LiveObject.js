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

	this.aAccessLayer = {};

	if(loParent){
		loParent.vloChildren.push(this);
		this.aAccessLayer.__proto__ = loParent.aAccessLayer;
	}
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
LiveObject.prototype.fCheckHonesty = function(){
	var lo=this;
	each(Object.keys(this.aAccessLayer), function(s){
		if (!(s in lo.alv)){
			throw("ILLEGAL VARIABLE ASSIGNMENT TO ACCESSLAYER " + lo.sName + "."+ s);
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

	var lo=this;
	if (!bExistsLocal){
		this.alv[s] = new LiveValue(this.sName + ":" + s, x, bMutable, f);
		Object.defineProperty(
			lo.aAccessLayer,	s, {
				get : function(){return lo.alv[s].fxGet();},
				set : function(x){return lo.alv[s].fSet(x);},
				configurable: true,
				enumerable: true,
				writeable : false
			}
		);
	}
	else{
		while(lo){
			if (lo.fbExistsLocally(s)){
				lo.alv[s].bMutable = bMutable;
				lo.alv[s].fSet(x);
				return;
			}
			lo = lo.loParent;
		}
		D("UNTRACKED DEFINE",this.sName,s);
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
LiveObject.prototype.fDelete = function(s){
	if (s in this.aAccessLayer){
		delete this.alv[s];
		delete this.aAccessLayer[s];
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




