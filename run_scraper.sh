#!/bin/bash

# Set up the environment
export PATH="/usr/local/bin:$PATH"
export PYTHONPATH="/Users/yaoster/Documents/GitHub/Connections-Grid:$PYTHONPATH"

# Change to the project directory
cd /Users/yaoster/Documents/GitHub/Connections-Grid

# Activate the Python environment (if using one)
# source /path/to/your/virtualenv/bin/activate

# Run the scraper
/usr/bin/python3 scraper.py 