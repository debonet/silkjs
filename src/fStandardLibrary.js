
module.exports = function(Silk, scope){


	var scopeInclude = new Silk.Scope("include");
	scope.defelt("include", function(){
		return function(scope,jq){

			return function(){
				var _ = scope._;

				if (!scopeInclude.checkvar(_.file)){
					scopeInclude.defvar(_.file, _._inner);

					Silk.fGet(_.file, function(err,sData){
						scopeInclude.setvar(
							_.file, 
							Silk.compile(scope.parent, Silk.parseHTML(sData))
						);

						Silk.digest();
					});
				}
					
				return scopeInclude.getvar(_.file);
			};
		};
	});

};

