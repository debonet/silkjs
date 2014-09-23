VividJS
======

At a superficial level, VividJS is one more web MVC framework, but
really what VividJS represents is an entirely new web developemnt paradigm.

VividJS is inspired by the promise of such advances as AngluarJS,
BackboneJS and Meteorjs, but made simple. We've done this by
effectively constructing an entirely new meta language (that sits
compatibly atop JS and HTML). Imagine developing web apps with in HTML
but with the power of Lisp, including Scoping, closures, and macros,
combined with the automatic coherence of systems like Prolog.


Status
------

This project began on 8/15/2014, so we're just getting started. Stay tuned for more!


New Paradigm
------------

Imagine writing a complex web application, such as Microsoft Word or Google Docs, but being 
able to do it like this:


~~~html

<menu>
	<menuitem label="file">
		<menuaction label="load" onchoose='DoLoadFile'></menuaction>
		<menuaction label="save" onchoose='DoSaveFile'></menuaction>
		...
	</menuitem>
	<menuitem label="edit">
		<menuaction label="copy" onchoose='DoCopy'></menuaction>
		<menuaction label="paste" onchoose='DoPaste'></menuaction>
		...
	</menuitem>
</menu>

<ribbon>
	<button label="enlargefont" onchoose="DoEnlargeFont" icon="EnlargeFont.png"></button>
	<choosefont></choosefont>
	...
</ribbon>

etc.
~~~


What do all those new elements like `<menu>`, `<menuitem>`, `<ribbon>` mean?
They are new elements defined within Vivid. 

But now, the creation of the element that implements the `<menu>` for
example can be developed independently from your application. It could
be created by another team and more importantly it can be updated
independently of of your application.

This is nothing new in the traditional application world. The various
versions of Microsoft Windows for example, defines all kinds of
controls (including menus), which can be shared and leveraged across
many applications.  

In the web world this tended to be a lot harder, until now.

Some details
------------

* VividJS is about 8K when minified and compressed.

* Currently VividJS uses jQuery, though that decision may change in the near future

* Browser compatibility: confirmed under Chrome, Firefox, Safari. Internet Explorer compatibility unknown


Sounds interesting. Can you show me some examples?
--------------------------------------------------

Let's get a little more concrete. One way to construct new elements is with a 
simple macro. When called macros replace themselves with new contents based on their
definiton.



~~~html

<defmacro name="studentrow" student="some name" grade="n/a">
	<tr>
		<td>
			Student: {{_.student}}
		</td>
		<td>
			Grade: {{_.grade}}
		</td>
		<td>
			Comments: {{_.inner}}
		</td>
	</tr>
</defmacro>

<table>
	<studentrow student="Bob Smith" grade="A+">Great Kid</studentrow>
	<studentrow student="John Doe" grade="B-">Needs help</studentrow>
</table>

~~~

yields:


~~~html

<table>
	<tr>
		<td>
			Student: Bob Smith
		</td>
		<td>
			Grade: A+
		</td>
	</tr>
	<tr>
		<td>
			Student: John Doe
		</td>
		<td>
			Grade: B-
		</td>
	</tr>
</table>

~~~




Ok, that's neat, but where's the power?
---------------------------------------

How about this instead:

~~~html

<defmacro 
	 name="describefamily" 
	 person="some person name" 
	 relationship="mother" 
	 kids="[]">

	<let len="{{_.kids.length}}">
	 	Did you know that {{_.person}} is the {{_.relationship}} of {{_.len}} kids.
		<if test="{{_.kids.length > 0}}">
			They are:
			<ul>
				<foreach items="{{_.kids}}" as="kid" indexby="num" len="{{_.kids.length}}">
					<li>
						<if test="{{_.num === _.len - 1}}">and </if>\
\						{{_.kid.name}}, age {{_.kid.age}}
					</li>
				</foreach>
			</ul>
		</if>
	</let>

</defmacro>


<describefamily 
	 person="Donald Duck" 
	 relationship="uncle"
	 kids='{{ [
	 {name: "Huey",  age: 7},
	 {name: "Dewey", age: 7},
	 {name: "Louie", age: 7}
	 ] }}'
	 />
								
~~~

But where do you ask do `<let>` and `<if>` and `<foreach>` come from?

They are constructs that can easily and trivially be written within Vivid itself!


~~~html
<!-- let element -->
<defmacro name="let">
	{{_._inner}}
</let>
~~~



~~~html

<!-- if element -->
<defelt name="if" test="false">
	return function(){
		if (_.test){
			return _._inner;
		}
		return $();
	};
</defelt>

~~~




~~~html

<!-- foreach element -->
<defelt name="foreach" items="{{[]}}" as="item" indexby="_index">
	var ascope = {};
	var scopeInner = new Scope();

	return function(){
		var jqOut = $();

		var a=_.items;

		// delete exess, if changed 
		each(ascope,function(scope,s){
			if (!(s in a)){
				delete ascope[s];
				scopeInner.del(s);
			}
		});

		// create new, if needed
		each(a,function(x,s){
			if (!(s in ascope)){
				ascope[s] = new Scope("FOREACH:"+s,scope);
				ascope[s].defvar(_.as, Vivid.expression(scope, "_.items['" + s + "']"));
				ascope[s].defvar(_.as, _.items[s]);
				ascope[s].defvar(_.indexby,s);
				scopeInner.defvar(s, Vivid.compile(ascope[s],jq.contents().clone()));
			}
		});

		// eval and add
		var ve = [];
		each(a,function(x,s){
			ve = ve.concat(scopeInner._[s].get());
		});
		return $(ve);
	};
</defelt>

~~~



How about attributes modifier?
------------------------------

Oh yeah we do! And it's super easy too. Here's an example

~~~html
<defattr name="stylize">
	return function(jqInstance){
	  jqInstance.find("*").andSelf().css(_.stylize);
	  return jqInstance;
	}
</defattr>
~~~

will recursively apply a style to the element and it's contents. Just take a look:

~~~html

<defmacro name="foo">
	<let x="{{_._inner}}">
		<div>	
			this is the 
			<span>
				value of the inner part
				{{_.x}}
				over here
			</span> 
			here
		</div>
	</let>
</defmacro>


<foo stylize="{{ {'padding':'5'} }}">
	<span style="font-size: 2em">
	 	Happy Happy Joy Joy!
	</span>
</foo>

~~~

Will give you:

~~~html
<div style="padding:: 5px;">	
	this is the 
	<span style="padding:: 5px;">
		value of the inner part
		<span style="font-size:: 2em; padding: 5px;">
	 		Happy Happy Joy Joy!
		</span>
		over here
	</span> 
	here
</div>
~~~




What about realtime DOM manipulation?
-------------------------------------

You bet! Take a look at this:

~~~html

<defattr name="watch">
	var sVar = _.watch;
	var sVal = _[sVar];
	jq.val(sVal);

	return function(jqInstance){
		jqInstance.on("input", function(){
			scope.parent.setvar(sVar, $(this).val());
			jqInstance.focus();
		});
		
		return jqInstance;
	}
</defattr>

<let val="initial value">
	<input watch="val">
	<br />
	You typed: {{_.val}} 
</let>
~~~



Ok, so show me some examples
----------------------------

How about tabs? Wouldn't it be nice to write:

~~~html
<let mytab="{{3}}">
	<tabs chosen="mytab" class="mytabclass">
		<tab label="foo">Contents for tab foo</tab>
		<tab label="bar">Contents for tab bar</tab>
		<tab label="baz">Contents for tab baz</tab>
	</tabs>

	You've selected {{_.mytab}}
</let>
~~~

And have it do the obvious thing. You can. Tabs can be defined programatically with `<defelt>`:

~~~html
<defelt name="tabs" chosen="tab">

	return function(){
		var _ = scope._;

		var jqTabs = _._inner.filter("tab");

		var jqOut = $("<ul></ul>");
		for (var n=0, c=jqTabs.length; n < c; n++){
			var jqTab = $("<li>" + $(jqTabs.get(n)).attr("label") + "</li>");
			
			jqTab.on('click',(function(n){
				return function(){
					_[_.chosen] = n;
				};
			})(n));
			jqOut.append(jqTab)
		}

		jqOut.append(jqTabs.eq(_[_.chosen]).contents());

		return jqOut;
	}
</defelt>
~~~


Or, even simpler, as a `<defmacro>`:

~~~html
<defmacro name="tabs" chosen="tab">
	<let tabscontent="{{_._inner.filter('tab')}}">

		<ul>
			<foreach items="{{_.tabscontent}}"  as="tabcontent" indexby="tabnum">
				<li click="_[_.chosen] = _.tabnum" >
					{{_.tabscontent.eq(_.tabnum).attr("label")}}
				</li>
			</foreach>			
		</ul>

	{{_.tabscontent.eq(_[_.chosen]).contents()}}

	</let>
</defmacro>
~~~


and of course, your new `<tabs>` and `<tab>` elements can be freely combined with other
constructs:


~~~html
<let mytab="{{3}}">
	<tabs chosen="mytab" class="mytabclass">
		<foreach items='{{ ["foo", "bar", "baz", "bing', "bop"] }}' as="item">
			<tab label="{{_.item}}">
				Contents for tab {{_.item}}
			</tab>
		</foreach>
	</tabs>

	You've selected {{_.mytab}}
</let>
~~~




Tell me about Scopes
--------------------

A key aspect of a programming language that can be used to develop large projects is 
the ability to encapsulate functionality. VividJS makes extensive use of scoping and lexical 
closure to ensure that functionality stays put, and only interfaces and not implemation 
details are exposed.

At every html element a new scope is formed and each scope derives from the scope if it's 
parent in the expected way.

~~~html
<outerElt a='outer' b='outer'>
	the value of a is {{_.a}}
	the value of b is {{_.b}}
	<innerElt a='inner'>
		the value of a is {{_.a}}
		the value of b is {{_.b}}
	</innerElt>
	the value of a is {{_.a}}
	the value of b is {{_.b}}
</outerElt>
~~~

will produce:

~~~html
<outerElt a='outer'>
	the value of a is outer
	the value of b is outer
	<innerElt a='inner'>
		the value of a is inner
		the value of b is outer
	</innerElt>
	the value of a is outer
	the value of b is outer
</outerElt>
~~~

Note how the value of `a` changes within the `<innerElt>`, but is consistent within 
the `outerElt` scope. Since the value of `b` was not changed by `<innerElt>` it has the same
value throughout.

And closures?
-------------

When a new scope is defined, computed values are taken from the enclosing scope, as in this example:

~~~html

<outerElt a='{{1}}'>
	the value of a is {{_.a}}
	<innerElt a='{{_.a+1}}'>
		the value of a is {{_.a}}
	</innerElt>
	the value of a is {{_.a}}
</outerElt>
~~~

yields

~~~html

<outerElt a='1'>
	the value of a is 1
	<innerElt a='2'>
		the value of a is 2
	</innerElt>
	the value of a is 1
</outerElt>
~~~


What about live values?
-----------------------

Suppose we extended our example above to:


~~~html

<defelt name='set'>
	return function(){
		scope.parent[_.var] = [_.val];
		return $();
	}
<defelt>

<outerElt a='{{1}}'>
	the value of a is {{_.a}}
	<innerElt a='{{_.a+1}}'>
		the value of a is {{_.a}}
	</innerElt>
	the value of a is {{_.a}}
	
	<set var='a' val='{{3}}'></set>
</outerElt>
~~~

would actually yield:

~~~html

<outerElt a='3'>
	the value of a is 3
	<innerElt a='4'>
		the value of a is 4
	</innerElt>
	the value of a is 3
</outerElt>
~~~


Notice how the value of `a`, when changed, is automatically made
consistent throughout it`s usage, with all dependencies being
automatically computed. 

Of course, the above example isn't really sensible. A more realistic example might be:

~~~html

<outerElt a='{{1}}'>
	the value of a is {{_.a}}
	<innerElt a='{{_.a+1}}'>
		the value of a is {{_.a}}
	</innerElt>
	the value of a is {{_.a}}
	
	<button click='_.a = 3'>Click Me</button>
</outerElt>
~~~

which would yield 1,2,1 before the button is clicked and 1,3,1 after.


Practical Use of Live Values
============================

How about the typical "hello world!"

~~~js

<let person="world">
	Hello {{_.person}}
	<br>
	Change Name: <input model="person">
</let>
~~~

In this example, notice that `Hello {{_.person}}` changes dynamically as you type 
in the input box.

It does not matter how the variable `person` changes, either from user input, or
an asyncronous network call, or some other event, the DOM is automatically updated
to be consistent with the variable values.



What's with the `_`'s?
======================

Each element constructs a new Scope (see Scoping above). A scope is composed
of 3 distinct namespaces, variables, elements, and attributes. 

To decrease code clutter, we introduce some syntactic "sugar" around
variable access, which make up the vast majority of scope-accessing
code that will be written. The normal way to access a variable would
be do do something like:

~~~js
	// increment myvar
	scope.setvar('myvar',scope.getvar('myvar') + 1);
~~~

But this is quite clumsy, especially when real-word expressions make use of multiple
variables. Instead we introduce a variable called `_` which provides common 
javascript-style syntactic access to scope variable. E.g. the code above can become:

~~~js
	_.myvar ++;
~~~

Until Harmony Proxies are broadly deployed, VividJs will _require_
variables be predefined prior to their use. This can be done with the
`defvar()` method. The following are equivalent:

~~~js
scope.defvar("newvar",5);
scope.setvar("newvar", scope.getvar("newvar") + 1);
~~~

and with sugar:

~~~js
_.defvar("newvar",5);
_.newvar++;
~~~


Note: even with the `_` sugar syntax, `defvar` must still be used.



Encapsulation
-------------

Bundles of functionaliy can be packaged up into separate VividJS
files. By convention we use the extension '.vivid'.  Files can be included using 
the `<include>` element. Here's a simple example:

Footer.vivid:
~~~html
<defmacro name="footer" author="">
	<hr/>
	This page was written by {{_.author}}
</defmacro>
~~~


index.html
~~~html

<html>
	<head>
		<script src="jquery.min.js"></script>
		<script src="vivid.js"></script>
	</head>
	<body style='visibility:hidden'>
	
		<div>
			<include url="Footer.vivid">Loading...</include>
		
			These are the page contents, blah blah blah.
		
			<footer author="me, myself and I"></footer>
		</div>
	</body>
</html>
~~~

Note however, that the `<include>` directive is fully scoped, and so
the definition of `<footer>` only exists within the `<div>`
element. Alternative definitions of footer could be created outside
that scop, or within child scopes.



Models and Controllers
----------------------

As you can see VividJS does a great job of allowing you to package up
Views and View Logic. In web-app development, that is a huge part of the battle.

It can also be quite advantageous to have controllers and models respect the scoping 
and encapsulation rules. Unlike AngularJS, in VividJS, controllers and models can be
bound to a specific scope (and all child scopes, unless alternately defined).

Here's an example:

myModel.js
~~~js
	Vivid.defineModule('myModel', function(scope,jq){
		scope.defvar("username","bob");
	});
~~~

myController.js
~~~js
	Vivid.defineModule('myController', function(scopeOuter,jqOuter){
		scope.defun("writeuser",function(scope,jq){
			var _=scope._;
			_.status = "writing...";
			$.ajax({
				url         : sResource,
				data        : _.username,
				type        : "POST",
				success     : function(){ _.status = "success"; },
				error  		: function(){ _.status = "error";	}
			});
		});
	}
~~~

myApp.vivid
~~~html
	<usemodule module="myModel">
		<h1> Hello {{_.username}}</h1>

		Change your name: <input model="username">
		
		<usemodule module="myController">
			<button click="writeuser()">Save Changes</button>
		</usemodule>
	</usemodule>
~~~



Installation and usage
----------------------

When used within a browser, simply add the lines:

~~~html
		<script src="jquery.min.js"></script>
		<script src="vivid.js"></script>
~~~

Also, we recommend adding `style="visibility:hidden"` to your `<body>`
element to prevent any undesireable flashes of uninterpreted VividJS
code.



There is also a command line tool called runvivid.js that can be 
invoked by:

~~~
	node runvivid.js myVividFile.vivid
~~~




This looks awesome. How can I get involved?
-------------------------------------------

Just drop us a line. There's tons to do. In particular things we're looking for:

* documentation
* unit test / testing
* standard library developers
* early application developers
* complaints / suggestions

