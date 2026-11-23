window.addEventListener('DOMContentLoaded', function init() {
	fetch('public/img/spotlight_pictures/manifest.json')
	  .then(function(response) {
	    return response.json();
	  })
	  .then(function(json) {
	  	image_list = json;
	  	chosen_image = image_list[0];

	  	portrait = document.getElementById("portrait");
	  	portrait.title = "portrait painted by Léo Bierent";
	  	portrait.src = "public/img/spotlight_pictures/" + encodeURIComponent(chosen_image);

	  });

});
