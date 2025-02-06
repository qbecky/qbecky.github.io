"""This code reads paper_data json file and creates a page for each project based on the json data

In a terminal, with the conda environment turned on, run the following command line:

python static_page_generator.py
python static_page_generator.py --erase_existing
python static_page_generator.py --projects kop_bending --erase_existing
python static_page_generator.py --projects all --erase_existing
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
PATH_TO_ICONS = os.path.join(PATH_TO_WEB, "public/img/icons")
PATH_TO_PAPER_PAGES = os.path.join(PATH_TO_WEB, "paper_pages")
PATH_TO_PAPER_FOLDER = os.path.join(PATH_TO_WEB, "papers")

from absl import app
from absl import flags
import json
from PIL import Image 
from pybtex.database.input import bibtex

FLAGS = flags.FLAGS
flags.DEFINE_boolean("erase_existing", False, "Whether to erase existing pages.")
flags.DEFINE_list("projects", [], "List of projects to generate pages for ('all' for all the projects).")

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
	
def fetch_svg_icon_text(link_name, width, height):
	if "PDF" in link_name:
		icon_name = "icons8-file.svg"
	elif "Code" in link_name:
		icon_name = "code-solid.svg"
	path_to_icon = os.path.join(PATH_TO_ICONS, icon_name)
	with open(path_to_icon, 'r') as icon_file:
		icon_text = icon_file.read()
	split_icon_text = icon_text.split("<svg")
	new_icon_text = split_icon_text[0] + f'<svg width={width}px height={height}px class="icon_links"' + split_icon_text[1]
	return new_icon_text

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

		resetAll = FLAGS.projects and FLAGS.projects[0] == "all"

		if (FLAGS.projects and project["project_name"] not in FLAGS.projects) and not resetAll:
			print(f"Skipping {pageTitle}. Not in projects list.")
			continue

		if os.path.exists(relLink) and not FLAGS.erase_existing:
			print(f"Skipping {pageTitle}. Page already exists.")
			continue

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
		with open(os.path.join(PATH_TO_PAPER_FOLDER, project['project_name'], 'coauthors_data.json'), 'r') as json_file:
			json_authors = json.load(json_file)
		textAuthors = ''
		for author in json_authors:
			name = author["name"]
			if "Quentin Becker" in name:
				name = "<b>" + name + "</b>"
			decoratedName = "<a href=" + author["website"] + ">" + name + "</a>"
			textAuthors += "<p>" + decoratedName + ', ' + "<span>" + author["affiliation"] + "</span>" + "</p>"
		textAuthors += "<br><p><span><i>" + project['conference'] + "</i>, " + str(project['year']) + "</span></p>"
		if "note" in project:
			textAuthors += "<p><span>" + project['note'] + "</span></p>"
		textAuthors += "<br>"
		thisTemplate = replaceString("$AUTHORS", textAuthors, thisTemplate)

		#format the links
		textLinks = []
		for link_name, link_val in project["links"].items():
			if link_name == "Project Page":
				continue
			if "PDF" in link_name:
				link_val = '../' + link_val
			textIcon = fetch_svg_icon_text(link_name, 18, 18)
			textLinks.append("<a href=" + link_val + ">" + textIcon + " " + link_name + "</a>")
		thisTemplate = replaceString("$LINKS", '<p>•</p>'.join(textLinks), thisTemplate)

		#format the abstract
		thisTemplate = replaceString("$ABSTRACT", abstract, thisTemplate)

		#format the citation
		citation = bib_data.to_string(bib_format='bibtex')
		thisTemplate = replaceString("$CITATION", citation, thisTemplate)

		#fetch the teaser and the caption
		teaser_path = project["teaser_image"]
		thisTemplate = replaceString("$PATH_TO_TEASER_IMAGE", teaser_path, thisTemplate)
		teaser_caption_path = os.path.join(PATH_TO_WEB, project["teaser_caption"])
		with open(teaser_caption_path, 'r') as caption_file:
			teaser_caption = caption_file.read()
		thisTemplate = replaceString("$TEASER_CAPTION", teaser_caption, thisTemplate)

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
