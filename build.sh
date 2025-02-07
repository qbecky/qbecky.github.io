cd website/src/py
python3 update_date.py
python3 static_page_generator.py --projects all
python3 build_image_manifest.py
cd ../../..
echo "Finished running python files."
