window.addEventListener('load', function() {
	let dataToLoad = {'data/miscellanea_data.json': 'misc-list'}

	for (const [data, container_id] of Object.freeze(Object.entries(dataToLoad))) {
		//gets project data from json file
		fetch(data)
		  .then(function(response) {
		    return response.json()
		  })
		  .then(function(json) {
		  	researchData = json;
		  	processMiscJson(json, container_id);
		  });
	}
	
});

function processMiscJson(jsonObj, list_id) {
	let container = document.getElementById(list_id);

	jsonObj.forEach(function(paper) {
		let outerDiv = document.createElement("div");
		outerDiv.classList.add("research-container");

		let img = document.createElement("div");
		img.classList.add("research-image");
		img.style.setProperty("background-image", `url(${paper.image})`);
		outerDiv.appendChild(img);

		let info = document.createElement("div");

		let title = document.createElement("p");
		title.classList.add("research-title");
		title.innerHTML = paper.title;
		info.appendChild(title);

		let note = document.createElement("p");
		note.classList.add("author-note");
		note.innerHTML = paper.short_description;
		info.appendChild(note);

		let links = document.createElement("div");
		links.classList.add("links");

		for (const [key, value] of Object.freeze(Object.entries(paper.links))) {
			let this_link = document.createElement("a");
			this_link.href = value;
			this_link.innerHTML = `<span style="white-space: nowrap">${key}</span>`;
			let space = document.createElement("p-inline");
			space.innerHTML = " ";
			links.appendChild(this_link);
			links.appendChild(space);
		}
		info.appendChild(links);
		
		outerDiv.appendChild(info);
		container.appendChild(outerDiv);
	});

}