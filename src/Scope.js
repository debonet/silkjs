"use strict";

var each = require("./each");
var ffBind = require("./ffBind");
var LiveObject = require("./LiveObject");
var D = require('./fDebugOutput');

var nScope=0;
var Scope = function(s, scopeParent, bVarOnly){
	this.sName=s + nScope;
	nScope ++;

	this.scopeParent = scopeParent;
	this.vlvListeners = [];

	scopeParent = scopeParent || {};
	this.loVariables  = new LiveObject(s + "(vars)", false, scopeParent.loVariables);
	this.loElements   = new LiveObject(s + "(elt)", false, scopeParent.loElements);
	this.loAttributes = new LiveObject(s + "(attr)", false, scopeParent.loAttributes);
};

Object.defineProperty(
	Scope.prototype,"_", {
		get: function(){return this.loVariables;}
	}
);

Object.defineProperty(
	Scope.prototype,"parent", {
		get: function(){return this.scopeParent;}
	}
);


// ---------------------------------------------------------------------------
Scope.prototype.__fDirty = function(){   
  this.vlvListeners.__forEach(function(lvListener){
    lvListener.__fDirty();
  });
};
 
// ---------------------------------------------------------------------------
Scope.prototype.__fRemoveListener = function(lv){
    this.vlvListeners.splice(this.vlvListeners.indexOf(lv),1);
};
 
// ---------------------------------------------------------------------------
Scope.prototype.__fAddListener = function(lv){
    this.vlvListeners.push(lv);
};
 


// variable methods
Scope.prototype.recompilevar = function(s){
	this.loVariables.__fRecompile(s);
};


// variable methods
Scope.prototype.defvar = function(s,x,f){
	return this.loVariables.__fDefine(s,x,f);
};

Scope.prototype.defun = function(s,x){
	return this.loVariables.__fDefine(s,function(){return x;});
};

Scope.prototype.defmutable = function(s,x){
	return this.loVariables.__fDefineMutable(s,x);
};

Scope.prototype.checkvar = function(s){
	return this.loVariables.__fbExists(s);
};

Scope.prototype.localvar = function(s){
	return this.loVariables.__fbExistsLocally(s);
};

Scope.prototype.delvar = function(s){
	return this.loVariables.__fDelete(s);
};

Scope.prototype.dirtyvar = function(s){
	D("DIRTYVAR",s);
	return this.loVariables.__fDirtyVar(s);
};

Scope.prototype.getvar = function(s){
	return this.loVariables.__fxGet(s);
};

Scope.prototype.setvar = function(s,x){
	return this.loVariables.__fSet(s,x);
};


// element methods
Scope.prototype.defelt = function(s,x){
	return this.loElements.__fDefine(s,function(){return x;});
};

Scope.prototype.checkelt = function(s){
	return this.loElements.__fbExists(s);
};

Scope.prototype.localelt = function(s){
	return this.loElements.__fbExistsLocally(s);
};

Scope.prototype.delelt = function(s){
	return this.loElements.__fDelete(s);
};

Scope.prototype.dirtyelt = function(s){
	return this.loElements.__fDirtyVar(s);
};

Scope.prototype.getelt = function(s){
	return this.loElements.__fxGet(s);
};

Scope.prototype.setelt = function(s,x){
	return this.loElements.__fSet(s,x);
};

// attribute methods
Scope.prototype.defattr = function(s,x){
	return this.loAttributes.__fDefine(s,function(){return x;});
};

Scope.prototype.checkattr = function(s){
	return this.loAttributes.__fbExists(s);
};

Scope.prototype.localattr = function(s){
	return this.loAttributes.__fbExistsLocally(s);
};

Scope.prototype.delattr = function(s){
	return this.loAttributes.__fDelete(s);
};

Scope.prototype.dirtyattr = function(s){
	return this.loAttributes.__fDirtyVar(s);
};

Scope.prototype.getattr = function(s){
	return this.loAttributes.__fxGet(s);
};

Scope.prototype.setattr = function(s,x){
	return this.loAttributes.__fSet(s,x);
};




module.exports = Scope;