#!/bin/bash

set -e

SHA=`git rev-parse --short --verify HEAD`

git config user.name "$COMMIT_AUTHOR"
git config user.email "$COMMIT_AUTHOR_EMAIL"
git checkout --orphan gh-pages
git rm --cached -r -f .
echo "# Automatic build" > README.md
echo "Built website from \`$SHA\`. See https://github.com/ethereum/remix-ide/ for details." >> README.md
echo "To use an offline copy, download \`remix-$SHA.zip\`." >> README.md
cp -r $FILES_TO_PACKAGE "./"
rm -rf dist
FILES_TO_DEPLOY="assets index.html main.js polyfills.js"
# ZIP the whole directory
zip -r remix-$SHA.zip $FILES_TO_DEPLOY
# -f is needed because "build" is part of .gitignore
git add -f $FILES_TO_DEPLOY remix-$SHA.zip
git commit -m "Built website from {$SHA}."

git push -f git@github.com:ethereum/remix-live.git gh-pages
