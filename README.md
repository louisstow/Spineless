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

A shortcut is to invoke the constructor as a function. This is just an
alias to super.

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

- **tag -** HTML tag to create (`'a'`, `'span'`, `'input'`). Default `div`.
- **children -** array of child nodes to create.
- **className -** the class attribute. Generally styling.
- **text -** will set the [`innerText`](https://developer.mozilla.org/en/docs/DOM/Node.textContent) of the node to this string value.
- **view -** use a `Spineless.View` instead of creating a DOM node. Every other property on the object will be passed into the view constructor.
- **id -** will allow the node to be referenced through an instance property.

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