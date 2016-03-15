#!/usr/bin/env bash

CONTAINER_NAME="sg-application-test-chrome"
# if a debug flag is passed in, use the debug image and open vnc screen sharing
if [[ $@ == *"--debug"* ]]; then
    ip=$(grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' <<< "$@")
    docker run -d --name $CONTAINER_NAME -p 4444:4444 -p 5900:5900 -v /dev/shm:/dev/shm selenium/standalone-chrome-debug:2.52.0
    sleep 2 # wait a bit for container to start
    open vnc://"$ip":5900
else
    docker run -d --name $CONTAINER_NAME -p 4444:4444 -v /dev/shm:/dev/shm selenium/standalone-chrome:2.52.0
fi

# run actual test command in a subshell to be able to rm docker container afterwards
(
    npm run test:application -- "$@" 2> /dev/null
)

# save exit code of subshell
testresult=$?

docker stop $CONTAINER_NAME 1> /dev/null && docker rm $CONTAINER_NAME 1> /dev/null

exit $testresult
