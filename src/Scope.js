"use strict";

var each = require("./each");
var ffBind = require("./ffBind");
var LiveObject = require("./LiveObject");

var Scope = function(s, scopeParent){
	this.sName=s;
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

// variable methods
Scope.prototype.defvar = function(s,x){
	return this.loVariables.fDefine(s,x);
};

Scope.prototype.defmutable = function(s,x){
	return this.loVariables.fDefineMutable(s,x);
};

Scope.prototype.checkvar = function(s,x){
	return this.loVariables.fbExists(s,x);
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
	return this.loVariables.fSet(s);
};


// element methods
Scope.prototype.defelt = function(s,x){
	return this.loElements.fDefine(s,x);
};

Scope.prototype.checkelt = function(s,x){
	return this.loElements.fbExists(s,x);
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
	return this.loElements.fSet(s);
};

// attribute methods
Scope.prototype.defattr = function(s,x){
	return this.loAttributes.fDefine(s,x);
};

Scope.prototype.checkattr = function(s,x){
	return this.loAttributes.fbExists(s,x);
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
	return this.loAttributes.fSet(s);
};



// ---------------------------------------------------------------------------
Scope.prototype.expr = function(x){
	var scope = this;

	var defvar     = ffBind(scope, 'defvar');
	var defmutable = ffBind(scope, 'defmutable');
	var delvar     = ffBind(scope, 'delvar');
	var checkvar   = ffBind(scope, 'checkvar');

	return eval(
		""
			+ "(function(){\n"
			+ "  var _ = scope._;"
			+ "  return " + x + ";\n"
			+ "})"
	);
};





module.exports = Scope;