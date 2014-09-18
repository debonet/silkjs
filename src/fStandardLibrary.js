var Vivid = require("./GlobalVivid");
var D = require("./fDebugOutput");

module.exports = function(scope){

	var scopeInclude = new Vivid.Scope("include");

	// ------------------------------------------------------------------------
	scope.defelt("include", function(scope,jq){
			var fjq;
			return function(){
				var _ = scope._;

				if (!scopeInclude.checkvar(_.url)){
					scopeInclude.defvar(_.url, _._inner);

					Vivid.fGet(_.url, function(err,sData){
						scopeInclude.setvar(
							_.url, 
							Vivid.parseHTML(sData)
						);

						fjq = null;
						scope.parent.recompilevar('_inner');

					});
				}
				if (!fjq){
					fjq = Vivid.compile(
						scope.parent, 
						scopeInclude.getvar(_.url).clone()
					);
				}

				return fjq();
			};
	});

	// ------------------------------------------------------------------------
	scope.defelt("usemodule", function(scope,jq){
			var bInstalled;
			return function(){
				var sModule = scope._.module
				if (!bInstalled){
					bInstalled = true;
					var ffjq = Vivid.ffjqModule(sModule);
					ffjq(scope,jq);
					scope.recompilevar('_inner');
				}
				return scope._._inner;
			}
	});

};

