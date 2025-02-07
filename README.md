# Personal Website

The code for my static personal website. Project and Publication data is read from a .json file by a Python script, which generates additional pages of the website. Javascript on the page also reads from the .json file and generates a dynamically laid out grid based on a recursive algorithm.

## Development

Gulp will auto-recompile and build the code for easy development. 

The main gulp command in `gulp dev` which starts an http server. When python or sass files are changed, they are recompiled. 

Running `gulp build` will build python and sass files.

(Building the python files also updates the date at the bottom of the page.)

IN a terminal, install `gulp` and `sass` through the `brew` commands

```
brew install gulp
brew install sass/sass/sass
```

## Building Python files

You will need to install a few libraries to run the script `build.sh`, you can run

```
conda create --name web_env
conda activate web_env
conda install -y pillow absl-py
pip install pybtex setuptools
```

## Deployment

In order to deploy through github pages, a new branch with the `website` subdirectory as its root must be created to do this, run the command

```
git subtree push --prefix website  origin gh-pages
```

If the `subtree push` fails mysteriously, try deleting the local & remote `gh-pages` branch with 
```
git push -d origin gh-pages
git branch -d gh-pages
``` 
and then run the above command again. [This is probably not the best way to fix this...]

## Adding a paper

In order to add a paper from a list of publications, you must:
- Add an entry to `data/paper_data.json` following the existing entries. The paths must be given relative to the position of `index.html` or `paper_pages/` depending on the field.
- Add the associated material in a new folder in `papers/` with the same name as the one given in `data/paper_data.json` in the field `"project_name"`.
- Run `public/src/py/static_page_generator.py` with the conda environment activated `conda activate web_env`. Be careful with the flag `--erase existing` and specify the list of project pages you would like to update.

## Adding a page

To add a page, you must:
- Add the page to the list of pages to be updated when running the `public/src/py/update_date.py` script.
