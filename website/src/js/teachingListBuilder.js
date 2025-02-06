window.addEventListener('load', function() {
	let dataToLoad = {'data/course_data.json': 'teaching-list'}

	for (const [data, container_id] of Object.entries(dataToLoad)) {
		//gets project data from json file
		fetch(data)
		  .then(function(response) {
		    return response.json()
		  })
		  .then(function(json) {
		  	researchData = json;
		  	processTeachingJson(json, container_id);
		  });
	}
	
});

function processTeachingJson(jsonObj, list_id) {
	let container = document.getElementById(list_id);

	jsonObj.forEach(function(paper) {
		let outerDiv = document.createElement("div");
		outerDiv.classList.add("teaching-container");

		let info = document.createElement("div");

		let title = document.createElement("p");
		title.classList.add("teaching-title");
		title.innerHTML = `<a href=${paper.link}>${paper.title}</a>`;
		info.appendChild(title);

		let pubinfo = document.createElement("p");
		pubinfo.classList.add("author-list");
		pubinfo.innerHTML = `<i>${paper.venue}</i>, ${paper.terms}`
		info.appendChild(pubinfo);
		outerDiv.appendChild(info);
		
		container.appendChild(outerDiv);
	

	});

}