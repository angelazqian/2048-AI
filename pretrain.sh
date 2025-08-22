#!/bin/bash

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing requirements..."
    pip install -r requirements.txt
    deactivate
fi

source venv/bin/activate
echo "cleaning data directory..."
cd data
for dir in */; do 
    if [ -d "$dir" ] && [ "${dir}" != "raw/" ]; then
        rm -rf "$dir"
    fi
done
cd ../
echo "running rotations.ipynb..."
jupyter nbconvert --to notebook --execute rotations.ipynb --output rotations.ipynb #"$(date +%Y%m%d_%H%M)_rotations.ipynb"
echo "DONE!!! :3"
deactivate