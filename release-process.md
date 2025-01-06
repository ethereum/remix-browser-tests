# Release process 

This document includes the release instructions for:
 - Feature freeze phase
 - Publishing `remixd` to NPM
 - Publishing remix libraries to NPM
 - Updating Remix's live version on remix.ethereum.org
 - Updating Remix's alpha version on remix-alpha.ethereum.org
 - Updating Remix's beta version on remix-beta.ethereum.org

## Feature Freeze
Once feature freeze is done, `remix_beta` should be updated to the latest master which will automatically update `remix-beta.ethereum.org` through a CI job.

Use this unified command:

 - `yarn run updateBeta`

or individually:

 - `git checkout remix_beta`
 - `git pull origin remix_beta`
 - `git reset --hard <master-commit-hash>` (`master-commit-hash` will be latest commit id from `master` branch)
 - `git push -f origin remix_beta`
 
## Testing
Testing is performed after the Feature Freeze on `remix-beta.ethereum.org`. `build-qa-doc.js` script can be used to generate the list of QA tasks. Instructions to use the file are given in the file itself: https://github.com/ethereum/remix-project/blob/master/build-qa-doc.js#L18 

Once ready to run, it can be run using the Node.js: `node build-qa-doc.js`

Find out the latest release highlights and update in `releaseDetails.json` file along with the `version` string. Also, update release blog link under `moreLink` field. This will set latest release details in the slide of `Featured` section.

## Remix Project NPM packages publishing

Once testing is completed, release will start by publishing Remix NPM packages.

 - Make sure you are on `master` branch: `git checkout master`
 - Pull the latest: `git pull origin master`
 - Create a branch: `git checkout -b bumpLibsVersion`

### remixd NPM release

  `yarn run publish:remixd`

This command will ask for a new version.

### Other libraries NPM release

  `yarn run publish:libs`
 
This command uses `lerna` and is solely responsible for publishing all the remix libraries. It will ask for a new version of each library. Make sure you are logged in to NPM.

Once these commands run successfully, the version for each remix library will be updated to the latest in the libs' package.json file.

 - Create and merge bump PR to master
 
## Remix IDE Release
:point_right: Make sure release highlights and blog link are updated to show them on Home tab, Featured section.

### Part 1. Bump the version and update Beta

#### Make sure `remix_beta` is up-to-date with `master` branch:

Use this unified command:

 - `yarn run updateBeta`

or individually:

 - `git checkout remix_beta`
 - `git pull origin remix_beta`
 - `git reset --hard <master-commit-hash>`
 - `git push -f origin remix_beta`

#### Create bump version PR:

 - Create a new branch from `remix_beta`: `git checkout -b bumpVersion`
 - Update package.json version. Usually, you need to remove `-dev` from the version string
 - Create a PR with base branch as `remix_beta`
 - Merge PR to **origin/remix_beta**

#### Create git tag from beta branch:

Use this unified command:

 - `yarn run publishTagfromBeta`

or individually:

 - `git checkout remix_beta`
 - `git pull origin remix_beta`
 - Create tag: `git tag v<version-number>`, `<version-number>` should be same as in package.json of `remix_beta` branch
 - Push tag: `git push --tags`

Publish a new release on GitHub using created tag and generate automated changelog by selecting the appropriate previous tag

### Part 2. Update the Remix Live

Updating the `remix_live` branch latest to the `remix_beta` runs the CircleCI build which updates live version of Remix IDE on `remix.ethereum.org`

Use this unified command:

 - `yarn run updateLive`

or individually:

 - `git checkout remix_live`
 - `git pull origin remix_live`
 - `git reset --hard <remix_beta-commit-hash>` or `<master-commit-hash>` sometimes
 - `git push -f origin remix_live`

 CircleCI will build automatically and remix.ethereum.org will be updated to the latest.

 ### Part 3. Upload zip file in GitHub release
 - Once CI is successful for `remix_live` branch, Go to https://github.com/ethereum/remix-live
 - Download the zip file with the name starting with `remix-`
 - Upload the zip file in GitHub assets by editing the release for this version
 
## Bump master branch 

 - `git checkout master`
 - `git pull origin master`
 - Create a new branch from `master`: `git checkout -b bumpDevVersion`
 - Bump the  package.json version, add the tag `-dev` if not already present.
 - Update new feature freeze date under `freeze-date` in `.github/workflows/pr-reminder.yml` file
 - Create and merge PR to `master`
 
 
## Remix IDE Beta Release
 - git fetch origin master
 - git checkout origin/master
 - git checkout -b bumpVersion
 - update package.json version to the new version "vx.x.x-beta.1"
 - merge PR
 - git fetch origin master
 - git checkout origin/master
 - git tag v(version-number) (with "vx.x.x-beta.1")
 - git push --tags
 - github-changes -o ethereum -r remix-project -a --only-pulls --use-commit-body --only-merges --between-tags previous_version...next_version
 - publish a beta release in github using the changelog
 - drop zip file to the beta release (from https://github.com/ethereum/remix-live-alpha)
 
## Remix IDE Alpha Release

remix-alpha.ethereum.org is automatically updated every time a commit is pushed to `master` branch
