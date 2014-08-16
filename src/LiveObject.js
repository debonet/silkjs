var D=console.log;
var each = require("./each");
var LiveValue = require("./LiveValue");

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveObject = function(s){
	this.sName = s;
	this.alv = {};
	this.vlvListeners  = [];
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
LiveObject.prototype.defvar = function(s,x){
//	D("DEF",this.sName,s);
	var lo = this;
	if (!Object.getOwnPropertyDescriptor(this,s)){
		Object.defineProperty(
			this,	s, {
				get: function() {return lo.get(s);},
				set: function(x){return lo.set(s,x);},
				configurable: true
			}
		);
	}

	this.alv[s] = new LiveValue(this.sName + ":" + s,x);
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
LiveObject.prototype.del = function(s){
	if (s in this.alv){
		delete this[s];
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.floClone = function(s){
	var lo = new LiveObject(s);

	each(this.alv, function(lv, slv){
		lo.alv[slv]=lv;

		Object.defineProperty(
			lo,	slv, {
				get: function() {return lo.get(slv);},
				set: function(x){return lo.set(slv,x);},
				configurable: true
			}
		);
	});

	return lo;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.expr = function(x,sLiveObject){
	var sLiveObject = sLiveObject || "_";
	var lo = this;
	return eval("var " + sLiveObject + "=lo;(function(){return " + x + "})");
};


LiveObject.prototype.clone = LiveObject.prototype.floClone;
LiveObject.prototype.fscopeClone = LiveObject.prototype.floClone;

module.exports = LiveObject;




