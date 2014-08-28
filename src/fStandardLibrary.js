var Silk = require("./GlobalSilk");
var D = require("./fDebugOutput");

module.exports = function(scope){

	var scopeInclude = new Silk.Scope("include");
	scope.defelt("include", function(){

		return function(scope,jq){

			var fCompile;
			return function(){
				var _ = scope._;

				if (!scopeInclude.checkvar(_.url)){
					scopeInclude.defvar(_.url, _._inner);

					Silk.fGet(_.url, function(err,sData){
						scopeInclude.setvar(
							_.url, 
							Silk.parseHTML(sData)
						);

						fCompile = null;
						scope.parent.recompilevar('_inner');
					});
				}

				if (!fCompile){
					fCompile = Silk.compile(
						scope.parent, 
						scopeInclude.getvar(_.url).clone()
					);
				}
				return fCompile();


			};
		};
	});

};

