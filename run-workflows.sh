#!/bin/bash

set -e

# Build and run the test pipeline with act: https://github.com/nektos/act
# If you run into rate limits, make sure you set a valid GITHUB_TOKEN environment variable.
npm run build && npm run pack && act -s GITHUB_TOKEN
