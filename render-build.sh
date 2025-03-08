#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting build process..."

# Install dependencies
npm install

# Install vite explicitly with exact path to ensure it's available
echo "Installing Vite globally to ensure it's available..."
npm install -g vite

# Run build
echo "Building the React application..."
npm run build

# Verify dist directory exists
if [ -d "dist" ]; then
  echo "Build successful! dist directory created."
else
  echo "Build may have failed. dist directory not found."
  exit 1
fi

echo "Build process completed successfully!" 