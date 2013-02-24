var headers = {
	"1": document.getElementsByTagName("h1"),
	"2": document.getElementsByTagName("h2"),
	"3": document.getElementsByTagName("h3")
};

//for every header
for (var header = 1; header <= 3; header++) {
	var current = headers[header];

	for (var i = 0; i < current.length; ++i) {
		var head = current[i];
		var name = head.childNodes.length && head.childNodes[0];
		
		//skip it!
		if (!name || !name.tagName) continue;

		if (name.tagName.toLowerCase() === "strong") {
			console.log(name.innerText);
		}
	}
}
