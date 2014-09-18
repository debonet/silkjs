
index.js: $(filter-out index.js, $(wildcard *.js))
	../node_modules/browserify/bin/cmd.js vivid.js > index.js


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