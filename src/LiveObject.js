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
	this.vlvListeners  = [];
	this.loParent = loParent;
	this.vloChildren = [];
	this.fRemakeAccessLayer();
};


// ---------------------------------------------------------------------------
LiveObject.prototype.getParent = function(){
	return this.loParent;
}

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
		a[slv] = lo.get(slv);
	});
	return a;
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

	var vslv = this.fvslv();

	var lo = this;
	vslv.forEach(function(s,n){
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

	each(this.vloChildren, function(lo){
		lo.fRemakeAccessLayer();
	});
};

// ---------------------------------------------------------------------------
LiveObject.prototype.defvar = function(s,x){
/*
	var bNew = !this.checkvar(s);

	if (bNew){
		this.alv[s] = new LiveValue(this.sName + ":" + s, x);
		this.fRemakeAccessLayer();
	}
	else{
		this.set(s,x);
	}
*/

	var bExistsLocal = this.localvar(s);

	if (!bExistsLocal){
		var bExists = this.checkvar(s);
		this.alv[s] = new LiveValue(this.sName + ":" + s, x);
		if (!bExists){
			this.fRemakeAccessLayer();
		}
	}
	else{
		this.set(s,x);
	}
};


// ---------------------------------------------------------------------------
LiveObject.prototype.defmutable = function(s,x){
	var bNew = !this.checkvar(s);
	this.alv[s] = new LiveValue(this.sName + ":" + s, x, true);

	if (bNew){
		this.fRemakeAccessLayer();
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.delvar = function(s){
	if (s in this.alv){
		delete this.alv[s];
		this.fRemakeAccessLayer();
		return;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.get = function(s){
	if (s in this.alv){
		return this.alv[s].fxGet();
	}
	if (this.loParent){
		return this.loParent.get(s);
	}
	D("GET UNKNOWN VARIABLE ",this.sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.set = function(s,x){
	if (s in this.alv){
		this.alv[s].fSet(x);
		this.alv[s].fAddListener(this);
		return;
	}
	if (this.loParent){
		return this.loParent.set(s,x);
	}
	D("SET UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.checkvar = function(s){
	if (s in this.alv){
		return true;
	}
	if (this.loParent){
		return this.loParent.checkvar(s);
	}
	return false;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.localvar = function(s){
	return s in this.alv;
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
	var lo = new LiveObject(s,this);
	this.vloChildren.push(lo);
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




