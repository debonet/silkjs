
vivid.js: $(wildcard src/*.js)
	node_modules/browserify/bin/cmd.js src/browservivid.js > web/vivid.js


TEST=.*
mocha = mocha -u bdd -t 10000 -b 

#
#
test:
ifeq ("${EMACS}","t")
			$(mocha) --reporter tap -g "$(TEST)"
else
			$(mocha) --reporter spec -g "$(TEST)"
endif

#	


.PHONY: test