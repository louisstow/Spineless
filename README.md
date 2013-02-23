# Spineless

This project is my ideal front-end JavaScript library (like Backbone or Spine) but with a much looser paradigm.

## Spineless.View

Every object in Spineless is a `View`. It contains some data (or a Model) and a DOM template. This template is converted to DOM nodes and appended to a DocumentFragment.

### **extend** `Spineless.View.extend(properties)`
Create a custom view by providing instance properties.

Setups up the prototype chain so you may can continue subclassing.

~~~javascript
var Button = Spineless.View.extend({
	init: function () { ... },
	onclick: function () { ... }
});

var DisabledButton = Button.extend({
	onclick: function () {
		return false;
	}
});
~~~

### **super** `Spineless.View.super(context, method, arguments)` *alias: Constructor*
Execute a method on the parent class. Pass the instance, the method name
and an array of arguments to apply to the method. A simple
trick is to use the [`arguments`](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Functions_and_function_scope/arguments) object native to JavaScript functions.

~~~javascript
var Button = Spineless.View.extend({
	init: function () {
		//execute `init` on the View class
		//with the same arguments passed into
		//this constructor
		Button.super(this, "init", arguments);
	}
});
~~~

A shortcut is to invoke the constructor as a function. This is an
alias to `super`.

~~~javascript
var Button = Spineless.View.extend({
	init: function () {
		//execute `init` on the View class
		//with the same arguments passed into
		//this constructor
		Button(this, "init", arguments);
	}
});
~~~

### **el** `view.el`
Every view has a reference to a DOM element (whether inserted to the page or not). 
When using a JSON template this is a [DocumentFragment](https://developer.mozilla.org/en-US/docs/DOM/document.createDocumentFragment). It can be inserted just like
any other DOM node (such as [`appendChild`](https://developer.mozilla.org/en-US/docs/DOM/Node.appendChild)). If the template refers to an existing node,
this will be a reference to that node.

~~~javascript
var button = new Button();
document.body.appendChild(button.el);
~~~

### **template** `view.template`
The heart of Views are templates represented as JSON and converted
to a DOM tree. It accepts an array of objects where the object
represents the node to create.

~~~javascript
var Button = Spineless.View.extend({
	template: [
		{tag: "a", className: "button", children: [
			{tag: "img", id: "icon"},
			{tag: "span", id: "label"}
		]}
	]
});
~~~

The following is a list of special properties. Everything else is
treated as attribute on the node.

- **tag -** HTML tag to create (e.g. `'a'`, `'span'`, `'input'`). Default `div`.
- **children -** array of child nodes to create.
- **className -** the class attribute. Generally styling.
- **text -** will set the [`innerText`](https://developer.mozilla.org/en/docs/DOM/Node.textContent) of the node to this string value.
- **view -** use a `Spineless.View` instead of creating a DOM node. Every other property on the object will be passed into the view constructor.
- **id -** will allow the node to be referenced through an instance property.

There may be situations where the template already exists in the HTML page. You
can point the template to the parent node by passing its `ID` attribute
as a string.

~~~html
<a id="existingButton">
	<img name="icon" />
	<span name="label"></span>
</a>
~~~

~~~javascript
var Button = Spineless.View.extend({
	template: "existingButton",
	render: function () {
		this.icon.style.display = "none";
		this.label.innerText = "Hello";
	}
});
~~~

Any child nodes with an `id` or `name` attribute will become instance properties.

### **events** `view.events`
Shorthand way of assigning instance methods to an event callback 
in the template tree.

~~~javascript
var Button = Spineless.View.extend({
	events: {
		"click el": "onclick"
	},

	onclick: function (evt) { ... }
});
~~~

The key is a notation to define first the event then the element in the
template by `id` (seperated by a space). The value is a string representing 
the method name in the class to trigger.

### **defaults** `view.defaults`
Use this object to define the properties for the `model` object of a view and
their default values.

~~~javascript
var Button = Spineless.View.extend({
	defaults: {
		icon: "/images/defaultIcon.png",
		label: "Button"
	}
});
~~~

### **model** `view.model`
This is the only seperation of concerns in the library. It is how
you access the instance model data. The values will be used to
serialize the view as well as send its data to the server.

If an input node in the template has an `id` (or `name`) attribute with 
the same name as a model property, the value will automatically be bound.

~~~javascript
var Login = Spineless.View.extend({
	defaults: {
		username: "",
		password: ""
	},

	events: {
		"click submit": "onsubmit"
	},

	template: [
		{tag: "input", id: "username", type: "text"},
		{tag: "input", id: "password", type: "password"},
		{tag: "button", id: "submit", text: "Go!"}
	],

	onsubmit: function () {
		console.log(this.model.username, this.model.password);
	}
});
~~~

*Note: An input node is an HTML element typically used in forms. This
includes `<input>`, `<select>`, `<button>`, `<textarea>`.*

### **render** `view.render()`
This method will be executed after the class has been instantiated
and on any `Change` events. You should put all code to modify the DOM
in this method.

~~~javascript
var UriEncoder = Spineless.View.extend({
	defaults: {
		input: ""
	},

	template: [
		{tag: "input", id: "input"},
		{tag: "span", id: "result"}
	],

	render: function () {
		this.result.innerText = encodeURIComponent(this.model.input);
	}
});
~~~

## Spineless.Event

At the root of every class is `Spineless.Event`. It manages emitting and
listening to events throughout the instance. The methods here should be very
familiar as the API is the same as [Backbone.js](http://documentcloud.github.com/backbone/#Events) and [Node.js](http://nodejs.org/api/events.html).

### **on** `event.on(eventName, callback)` *alias: bind, subscribe*
Bind a callback function to an event name. Colons are used
as a convention to namespace event types (e.g. `change:textbox`). 

*Note: This will only work with one level of namespacing.*

An asterisk `*` can be used as a wildcard to listen to all
events in a namespace.

~~~javascript
//listen to all change events
this.on("change:*", function () { ... });
//listen to a specific change event
this.on("change:textbox", function () { ... });
~~~

To bind multiple events to a single callback, specify multiple
event names delimeted by a space.

~~~javascript
this.on("change:textbox change:checkbox", ... );
~~~

An object can instead be passed to map event names to callback functions.

~~~javascript
this.on({
	"change:textbox change:checkbox": this.update,
	"dom:click": this.submit
});
~~~

### **off** `event.off(eventName, callback)` *alias: unbind, unsubscribe*
Remove a bound callback from an event name. If no callback is specified,
all events with that name will be remove. If neither callback or event name
is specified, every event will be removed.

~~~javascript
//remove a specific callback on `change`
this.off("change", this.onChange);

//remove every callback on `change`
this.off("change");

//remove every event handler
this.off();
~~~

### **emit** `event.emit(eventName[, args*])` *alias: trigger, publish`*
Execute callbacks that are bound to this event name. Every subsequent argument
will be passed into the callback function as arguments.

~~~javascript
//listen for the `ping` event
this.on("ping", function (message) {
	alert("Pong " + message);
});

//trigger the `ping` handler and pass in
//the string "dong" as an argument.
this.emit("ping", "dong");
~~~

### **once** `event.once(eventName, callback)`
Bind to an event for one use only and then remove the callback.

### Internal Events

- `change (key, value)` after a bound input node changes its value.
- `change:key (value)` after a specific input node changes its value.
- `prechange (key, value)` before a bound input node changes its value.
- `prechange:key (value)` before a specific input node changes its value.
- `dom:event (DOMEvent)` when a [DOM event](https://developer.mozilla.org/en-US/docs/DOM/event) has been created through `events` object.
- `child:add (child)` when a child view has been added to `this`.
- `child:remove (child)` when a child view has been removed from `this`.
- `parent:add (parent)` when a parent view has been added to `this`.
- `parent:remove (parent)` when a parent view has been removed from `this`.
- `invalid (errorString)` when `validation()` returns an error.
- `error (errorObject)` when an error occurs in `sync()`.

## Examples

The following example will create a Button view class.

~~~javascript
var CustomButton = Spineless.View.extend({
	//define the default properties for this class
	//will be accessible through `this.model`.
	defaults: {
		icon: "",
		label: ""
	},

	//define your HTML template in JSON
	template: [
		{tag: "a", children: [
			//assigning an ID attribute will make the node
			//accessible within this class
			{tag: "img", id: "icon"},
			{tag: "span", id: "label"}
		]}
	],

	render: function () {
		//these refer to the nodes we created in the template above
		this.icon.src = this.model.icon;
		this.label.innerText = this.model.label;
	}
});

//properties passed into the constructor that are
//part of the model will automatically be copied
var myButton = new CustomButton({
	icon: "/path/to/icon.png",
	label: "My Button"
});
~~~

The `myButton` instance won't actually add anything to the
page as all the DOM nodes created are applied to a DocumentFragment. We
must append the fragment to the webpage DOM tree. This is available through
`myButton.el`.

~~~javascript
document.getElementById("navigation").appendChild(myButton.el);
~~~

## Legacy Browser Support
Spineless makes use of a few modern JavaScript APIs. If you need to support
older browsers you may need to shim these APIs.

- `JSON.stringify()` - Used to serialize a View. Recommended shim: [json2](https://github.com/douglascrockford/JSON-js)
- `Function.bind()` - This is a quick way to modify the context of a function. Recommended shim: [MDN](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind#Compatibility) or [ES5-shim](https://github.com/kriskowal/es5-shim)