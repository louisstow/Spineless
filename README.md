# Spineless

This project is my ideal front-end JavaScript library (like Backbone or Spine) but with a much looser paradigm.

## Views

Every object in Spineless is a `View`. It contains some data (or a Model) and a DOM template. This template is converted to DOM nodes and appended to a DocumentFragment.

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
		this.img.src = this.model.icon;
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