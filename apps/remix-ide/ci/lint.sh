#!/usr/bin/env bash

set -e

BUILD_ID=${CIRCLE_BUILD_NUM:-${TRAVIS_JOB_NUMBER}}
echo "$BUILD_ID"
TEST_EXITCODE=0

KEYS=$(jq -r '.projects | keys | map(. + ".js") ' workspace.json  | tr -d '[],"')
# add .js to all elements in array KEYS
TESTFILES=$(echo $KEYS | circleci tests split)
echo $TESTFILES

echo "$TEST_EXITCODE"
if [ "$TEST_EXITCODE" -eq 1 ]
then
  exit 1
fi
