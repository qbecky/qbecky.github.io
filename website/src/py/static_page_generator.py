"""This code reads paper_data json file and creates a page for each project based on the json data

In a terminal, with the conda environment turned on, run the following command line:

python static_page_generator.py
python static_page_generator.py --erase_existing
"""

import os
import sys as _sys

def parent_dir(directory):
	return os.path.dirname(directory)

PATH_TO_SCRIPT = parent_dir(os.path.realpath(__file__))
PATH_TO_REPO = parent_dir(parent_dir(parent_dir(PATH_TO_SCRIPT)))
PATH_TO_WEB = os.path.join(PATH_TO_REPO, "website")
PATH_TO_DATA = os.path.join(PATH_TO_WEB, "data")
PATH_TO_PAPER_IMAGES = os.path.join(PATH_TO_WEB, "public/img/project_images")
PATH_TO_PAPER_PAGES = os.path.join(PATH_TO_WEB, "paper_pages")
PATH_TO_PAPER_FOLDER = os.path.join(PATH_TO_WEB, "papers")

from absl import app
from absl import flags
import json
from PIL import Image 
from pybtex.database.input import bibtex

FLAGS = flags.FLAGS
flags.DEFINE_boolean("erase_existing", False, "Whether to erase existing pages.")

# returns str resulting of replacing first instance of template in string with replacement
def replaceString(template, replacement, string):
	ind = string.find(template)
	while ind != -1:
		string = string[:ind] + replacement + string[ind + len(template):]
		ind = string.find(template)
	return string

def get_aspect_ratio(img_string):
	file = os.path.join(PATH_TO_PAPER_IMAGES, img_string)
	with Image.open(file) as im:
	    return im.width / im.height

def main(_):
	# load json file
	with open(os.path.join(PATH_TO_DATA, 'paper_data.json'), 'r') as json_file:
		json_data = json.load(json_file)

	# load project template
	with open('paper_template.html') as template_file:
		projectTemplate = template_file.read()

	for project in json_data:
		pageTitle = project["project_name"]
		relLink = os.path.join(PATH_TO_PAPER_PAGES, pageTitle + '.html')
		project["page_link"] = relLink

		if os.path.exists(relLink) and not FLAGS.erase_existing:
			print(f"Skipping {pageTitle}. Page already exists.")
			continue

		with open(os.path.join(PATH_TO_PAPER_FOLDER, project['project_name'], 'coauthors_data.json'), 'r') as json_file:
			json_authors = json.load(json_file)
		parser = bibtex.Parser()
		bib_data = parser.parse_file(os.path.join(PATH_TO_PAPER_FOLDER, project['project_name'], 'citation.bib'))
		assert len(bib_data.entries) == 1, f"Expected 1 entry in {project['project_name']}/citation.bib, got {len(bib_data.entries)}"
		for entry in bib_data.entries:
			abstract = bib_data.entries[entry].fields['abstract']
			bib_data.entries[entry].fields.pop('abstract')
     
		thisTemplate = str(projectTemplate)

		#set tile for page & heading
		thisTemplate = replaceString("$PAGE_TITLE", project["title"], thisTemplate)
		thisTemplate = replaceString("$TITLE", project["title"], thisTemplate)

		#format the authors
		textAuthors = ''
		for author in json_authors:
			name = author["name"]
			if "Quentin Becker" in name:
				name = "<b>" + name + "</b>"
			decoratedName = "<a href=" + author["website"] + ">" + name + "</a>"
			textAuthors += "<p>" + decoratedName + ', ' + "<span>" + author["affiliation"] + "</span>" + "</p>"
		thisTemplate = replaceString("$AUTHORS", textAuthors, thisTemplate)

		#format the abstract
		thisTemplate = replaceString("$ABSTRACT", abstract, thisTemplate)

		#format the citation
		citation = bib_data.to_string(bib_format='bibtex')
		thisTemplate = replaceString("$CITATION", citation, thisTemplate)

		#fetch the teaser
		teaser_path = project["teaser_image"]
		thisTemplate = replaceString("$PATH_TO_TEASER_IMAGE", teaser_path, thisTemplate)

		#fetch the fast forward if it exists
		if "fast_forward" in project:
			ff_string = f'<h2> Fast Forward </h2>\n<video controls width="100%">\n\t<source src={project["fast_forward"]} type=video/mp4></iframe>\n</video>'
			thisTemplate = replaceString("$FAST_FORWARD", ff_string, thisTemplate)
		else:
			thisTemplate = replaceString("$FAST_FORWARD", "", thisTemplate)
		
		#write to html file (and store the name in the json)
		pageTitle = []
		for char in project["title"]:
			if char == ' ':
				pageTitle.append("-")
			else:
				pageTitle.append(char)

		newPage = open(relLink, 'w')
		newPage.write(thisTemplate)
		newPage.close()

	dynamicJsonData = json.dumps(json_data)

	jsonFile = open(os.path.join(PATH_TO_DATA, "dynamic_data.json"), "w")
	jsonFile.write(dynamicJsonData)
	jsonFile.close()

if __name__ == '__main__':
    app.run(main)
