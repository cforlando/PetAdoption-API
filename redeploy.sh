#!/bin/bash

sudo su
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
echo "$(date): Checking for updates. User is $(whoami)."
cd $SCRIPTPATH
git fetch
if [ $(git rev-parse HEAD) != $(git rev-parse @{u}) ]; then
	echo "New commits on remote."
	echo "Pulling remote."
	git pull origin
	echo "Restarting services."
        $SCRIPTPATH/restart_services.sh
	echo "All done."
else
	echo "Current with remote."
fi
