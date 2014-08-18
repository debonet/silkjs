var D=console.log;
var each = require("./each");
var LiveValue = require("./LiveValue");
var ffBind = require("./ffBind");

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveObject = function(s){
	this.sName = s;
	this.alv = {};
	this.abLocal = {};
	this.vlvListeners  = [];
	this.fRemakeAccessLayer();
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
LiveObject.prototype.fRemakeAccessLayer = function(){
	delete this._;
	this._ = {};

	var lo = this;
	each(this.alv, function(x,s){
		Object.defineProperty(
			lo._,	s, {
				get : function(){return lo.get(s);},
				set : function(x){return lo.set(s,x);},
				configurable: true,
				enumerable: true,
				writeable : false
			}
		);
	});
	
	Object.freeze(this._);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.defvar = function(s,x){
	var bNew = !(s in this.alv);
	this.alv[s] = new LiveValue(this.sName + ":" + s, x);
	this.abLocal[s] = true;

	if (bNew){
		this.fRemakeAccessLayer();
	}
};


// ---------------------------------------------------------------------------
LiveObject.prototype.defmutable = function(s,x){
	var bNew = !(s in this.alv);
	this.alv[s] = new LiveValue(this.sName + ":" + s, x, true);

	if (bNew){
		this.fRemakeAccessLayer();
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.get = function(s){
	if (s in this.alv){
		return this.alv[s].fxGet();
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.set = function(s,x){
	if (s in this.alv){
		this.alv[s].fSet(x);
		this.alv[s].fAddListener(this);
		return;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.delvar = function(s){
	if (s in this.alv){
		delete this.alv[s];
		lo.fRemakeAccessLayer();
		return;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.checkvar = function(s){
	return s in this.alv;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.localvar = function(s){
	return s in this.abLocal;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbIsDirty = function(s){
	if (s in this.alv){
		return this.alv[s].bDirty;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.floClone = function(s){
	var lo = new LiveObject(s);

	each(this.alv, function(lv, slv){
		lo.alv[slv]=lv;
	});

	lo.fRemakeAccessLayer();
	return lo;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.expr = function(x){
	var sLiveObject = sLiveObject || "_";
	var lo = this;
	var sScope = "lo";
	return eval(
		""
			+ "var defvar     = ffBind(" + sScope + ", 'defvar');\n"
			+ "var defmutable = ffBind(" + sScope + ", 'defmutable');\n"
			+ "var delvar     = ffBind(" + sScope + ", 'delvar');\n"
			+ "var checkvar   = ffBind(" + sScope + ", 'checkvar');\n"
			+ "var _          = " + sScope + "._;\n"
			+ "(function(){return " + x + "})"
	);
};


LiveObject.prototype.clone = LiveObject.prototype.floClone;
LiveObject.prototype.fscopeClone = LiveObject.prototype.floClone;

module.exports = LiveObject;




