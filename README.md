SilkJS
======

SilkJS is a web MV* framework. Inspired by the promise of AngluarJS, but turned off by its rough edges, the SilkJS attempts to provide smooth and graceful framework for web application development.


Status
------

This project began on 8/15/2014, so we're just getting started. Stay tuned for more!

What can silk do for me?
------------------------

How about this!

~~~html

<defmacro name="studentrow" student="some body" grade="n/a">
	<tr>
		<td>
			Student: {{_.student}}
		</td>
		<td>
			Grade: {{_.grade}}
		</td>
	</tr>
</defmacro>

<table>
	<studentrow student="Bob Smith" grade="A+" />
	<studentrow student="John Doe" grade="B-" />
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

They are constructs that can easily and trivially be written within Silk itself!


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




~~~js

<!-- foreach element -->
<defelt scope="_" name="foreach" items="[]" as="_item" indexby="_index">
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
				ascope[s] = scope.clone();
				ascope[s].defvar(_.as, scope.expr("_.items[" + s + "]"));
				ascope[s].defvar(_.indexby,s);
				scopeInner.defvar(s,compile(ascope[s],jq.contents().clone()));
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

~~~js
<defattr name="stylize">
	return function(jqInstance){
	  jqInstance.find("*").andSelf().css(_.stylize);
	  return jqInstance;
	}
</defattr>
~~~

will recursively apply a style to the element and it's contents. Just take a look:

~~~js

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

~~~js

<defattr name="watch">
	var sVar = _.watch;
	var sVal = _[sVar];
	jq.val(sVal);

	return function(jqInstance){
		jqInstance.on("input", function(){
			scope.parent.setvar(sVar, $(this).val());
			Silk.digest();
			jqInstance.focus();
		});
		
		return jqInstance;
	}
</defattr>

<let val="initial value" prompt="Type something bozo!">
	<input watch="val" placeholder="{{_.prompt}}">
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

~~~js
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

		jqOut.append(jqTabs.eq(_[_.chosen]).contentes());

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
		<foreach items='{{ ["foo", "bar", "baz", "bing', "bop"] }}'>
			<tab label="{{_._item}}">
				Contents for tab {{_._item}}
			</tab>
		</foreach>
	</tabs>

	You've selected {{_.mytab}}
</let>
~~~




This looks awesome. How can I get involved?
-------------------------------------------

Just drop us a line. There's tons to do. In particular things we're looking for:

* documentation
* unit test / testing
* standard library developers
* beta developers
* complaints /suggestions

