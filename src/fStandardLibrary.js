var Silk = require("./GlobalSilk");

module.exports = function(scope){

	var scopeInclude = new Silk.Scope("include");
	scope.defelt("include", function(){
		return function(scope,jq){

			return function(){
				var _ = scope._;

				if (!scopeInclude.checkvar(_.url)){
					scopeInclude.defvar(_.url, _._inner);

					Silk.fGet(_.url, function(err,sData){
						scopeInclude.setvar(
							_.url, 
							Silk.compile(scope.parent, Silk.parseHTML(sData))
						);

//						scope.parent.recompilevar('_inner');
						console.log("RECOMPILE FOR",_.url);
						Silk.scope.recompilevar('_inner');
					});
				}

				return scopeInclude.getvar(_.url);
			};
		};
	});

};
