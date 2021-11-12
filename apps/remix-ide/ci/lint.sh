#!/usr/bin/env bash

set -e

BUILD_ID=${CIRCLE_BUILD_NUM:-${TRAVIS_JOB_NUMBER}}
echo "$BUILD_ID"
TEST_EXITCODE=0

npm run build:e2e
KEYS=$(jq -r '.projects | keys' workspace.json  | tr -d '[],"')
# add .js to every key
KEYS=$(echo $KEYS | sed 's/\(.*\)/\1.js/')
# keys to array
KEYS=($KEYS)

TESTFILES=$(echo $KEYS | circleci tests split)
echo $TESTFILES


echo "$TEST_EXITCODE"
if [ "$TEST_EXITCODE" -eq 1 ]
then
  exit 1
fi
