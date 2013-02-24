var rootNode = document.getElementById("content");
var lastLevel = 0;

var html = "";
for (var i = 0; i < rootNode.childNodes.length; ++i) {
	var node = rootNode.childNodes[i];
	if (!node.tagName || node.tagName.charAt(0) !== "H") {
		continue;
	}

	var level = +node.tagName.substr(1);
	var name = node.childNodes[0].innerText || node.innerText;
	var hashable = name.replace(/[\.\s]/g, "-");
	node.id = hashable;

	console.log(name, level, lastLevel);

	if (level > lastLevel) {
		html += "";
	} else if (level < lastLevel) {
		html += (new Array(lastLevel - level + 2)).join("</ul></li>");
	} else {
		html += "</ul></li>";
	}

	html += "<li><a href='#" + hashable + "'>" + name + "</a><ul>";
	lastLevel = level;
}

document.getElementById("nav").innerHTML = html;
