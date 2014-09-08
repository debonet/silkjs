var Silk = require("./GlobalSilk");
var D = require("./fDebugOutput");

module.exports = function(scope){

	var scopeInclude = new Silk.Scope("include");

	// ------------------------------------------------------------------------
	scope.defelt("include", function(scope,jq){
			var fjq;
			return function(){
				var _ = scope._;

				if (!scopeInclude.checkvar(_.url)){
					scopeInclude.defvar(_.url, _._inner);

					Silk.fGet(_.url, function(err,sData){
						scopeInclude.setvar(
							_.url, 
							Silk.parseHTML(sData)
						);

						fjq = null;
						scope.parent.recompilevar('_inner');

					});
				}
				if (!fjq){
					fjq = Silk.compile(
						scope.parent, 
						scopeInclude.getvar(_.url).clone()
					);
				}

				return fjq();
			};
	});

	// ------------------------------------------------------------------------
	scope.defelt("controller", function(scope,jq){
			var bInstalled;
			return function(){
				var sModule = scope._.module
				if (!bInstalled){
					bInstalled = true;
					var ffjq = Silk.ffjqModule(sModule);
					ffjq(scope,jq);
					scope.recompilevar('_inner');
				}
				return scope._._inner;
			}
	});

};

