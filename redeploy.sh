#!/bin/bash

sudo su
echo "$(date): Checking for updates. User is $(whoami)."
cd /home/ubuntu/PetAdoption-API
git fetch
if [ $(git rev-parse HEAD) != $(git rev-parse @{u}) ]; then
	echo "New commits on remote."
	echo "Pulling remote."
	git pull origin
	echo "Restarting services."
	/home/ubuntu/PetAdoption-API/restart_services.sh
	echo "All done."
else
	echo "Current with remote."
fi
