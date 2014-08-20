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

<defmacro name="studentrow" student="'some body'" grade="'n/a'">
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
	<studentrow student="'Bob Smith'" grade="'A+'" />
	<studentrow student="'John Doe'" grade="'B-'" />
</table>

~~~

yields:


~~~html

<table>
	<tr>
		<td>
			Bob Smith
		</td>
		<td>
			A+
		</td>
	</tr>
	<tr>
		<td>
			John Doe
		</td>
		<td>
			B-
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
	 of="'some moms name'" 
	 relationship="'mother'" 
	 kids="[]">
	Did you know that {{_.mom}} is the {{_.relationship}} of {{_.kids.length}} kids.
	<if test="_.kids.length > 0">
		They are:
		<ul>
			<foreach items="_.kids" as="'kid'">
				<li>
					{{_.kid.name}} aged {{_.kid.age}} years old
				</li>
			</foreach>
		</ul>
	</if>
</defmacro>

<describefamily 
	 of="'Donald Duck'" 
	 relationship="'uncle'"
	 kids='[
			{name: "Huey",  age: 7},
			{name: "Dewey", age: 7},
			{name: "Louie", age: 7}
	 ]'
/>
								
</table>

~~~

But where do you ask do `<foreach>` and `<if>` come from?

They are constructs that can easily and trivially be written within Silk itself!



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
<defelt scope="_" name="foreach" items="[]" as="'_item'" indexby="'_index'">
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
				ascope[s].defvar(_[_.as],scope.expr("_.items['" + s + "']"));
				ascope[s].defvar(_[_.indexby],s);
				scopeInner.defvar(s,_._createInner(ascope[s]));
			}
		});

		// eval and add
		each(a,function(x,s){
			jqOut = jqOut.add(scopeInner._[s]);
		});
		return jqOut;
	};
</defelt>


~~~








What about realtime DOM manipulation?
-------------------------------------

Uh huh. Sure! Take a look at this:

~~~js
<defelt name="watch">
	return function(){
		var _ = scope._;
		var jq = _._inner;

		// safely bind the event using standard jQuery
		jq.on("input", function(){
			scope.parent.set(_.var, $(this).val());

			// make sure we look for a change
			Silk.digest();
			jq.focus();
		});
		return jq;
	};
</defelt>


<div yourinput="'no input yet....'">
	<watch var="'yourinput'">
		<input>
	</watch>
	Your input is: {{_.yourinput}}
</div>

~~~





This looks awesome. How can I get involved?
-------------------------------------------

Just drop us a line. There's tons to do. In particular things we're looking for:

* documentation
* unit test / testing
* standard library developers
* beta developers
* complaints /suggestions

