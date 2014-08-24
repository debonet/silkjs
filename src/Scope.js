"use strict";

var each = require("./each");
var ffBind = require("./ffBind");
var LiveObject = require("./LiveObject");

var Scope = function(s, scopeParent){
	this.sName=s;
	this.scopeParent = scopeParent;

	scopeParent = scopeParent || {};
	this.loVariables  = new LiveObject(s + "(vars)", scopeParent.loVariables);
	this.loElements   = new LiveObject(s + "(elt)", scopeParent.loElements);
	this.loAttributes = new LiveObject(s + "(attr)", scopeParent.loAttributes);
};

Object.defineProperty(
	Scope.prototype,"_", {
		get: function(){return this.loVariables.aAccessLayer;}
	}
);

Object.defineProperty(
	Scope.prototype,"parent", {
		get: function(){return this.scopeParent;}
	}
);

// variable methods
Scope.prototype.defvar = function(s,x,f){
	return this.loVariables.fDefine(s,x,f);
};

Scope.prototype.defun = function(s,x){
	return this.loVariables.fDefine(s,function(){return x;});
};

Scope.prototype.defmutable = function(s,x){
	return this.loVariables.fDefineMutable(s,x);
};

Scope.prototype.checkvar = function(s){
	return this.loVariables.fbExists(s);
};

Scope.prototype.localvar = function(s){
	return this.loVariables.fbExistsLocally(s);
};

Scope.prototype.delvar = function(s){
	return this.loVariables.fDelete(s);
};

Scope.prototype.dirtyvar = function(s){
	return this.loVariables.fbIsDirty(s);
};

Scope.prototype.getvar = function(s){
	return this.loVariables.fxGet(s);
};

Scope.prototype.setvar = function(s,x){
	return this.loVariables.fSet(s,x);
};


// element methods
Scope.prototype.defelt = function(s,x){
	return this.loElements.fDefine(s,x);
};

Scope.prototype.checkelt = function(s){
	return this.loElements.fbExists(s);
};

Scope.prototype.localelt = function(s){
	return this.loElements.fbExistsLocally(s);
};

Scope.prototype.delelt = function(s){
	return this.loElements.fDelete(s);
};

Scope.prototype.dirtyelt = function(s){
	return this.loElements.fbIsDirty(s);
};

Scope.prototype.getelt = function(s){
	return this.loElements.fxGet(s);
};

Scope.prototype.setelt = function(s,x){
	return this.loElements.fSet(s,x);
};

// attribute methods
Scope.prototype.defattr = function(s,x){
	return this.loAttributes.fDefine(s,x);
};

Scope.prototype.checkattr = function(s){
	return this.loAttributes.fbExists(s);
};

Scope.prototype.localattr = function(s){
	return this.loAttributes.fbExistsLocally(s);
};

Scope.prototype.delattr = function(s){
	return this.loAttributes.fDelete(s);
};

Scope.prototype.dirtyattr = function(s){
	return this.loAttributes.fbIsDirty(s);
};

Scope.prototype.getattr = function(s){
	return this.loAttributes.fxGet(s);
};

Scope.prototype.setattr = function(s,x){
	return this.loAttributes.fSet(s,x);
};



// ---------------------------------------------------------------------------
Scope.prototype.expr = function(x){
	var scope = this;

	return eval(
		""
			+ "(function(){\n"
			+ "  var _ = scope._;\n"
			+ "  return " + x + ";\n"
			+ "})"
	);
};





module.exports = Scope;