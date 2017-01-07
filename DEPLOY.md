## Deploying Pet Adoption

The current deployment steps involve setting up a cron job on a Docker host.

1. Check out repository on Docker host
2. Create and populate `envvars.sh` (see below)
3. Create cron job (see immediately below)

### The cron job

Looks something like: `* * * * * . /home/ubuntu/envvars.sh; /home/ubuntu/PetAdoption-API/redeploy.sh >> /home/ubuntu/deploy.log 2>&1`

You may need to alter `/home/ubuntu` according to the particulars of your setup.

### envvars.sh

A shell script used to determine the environment for the cron job. We need this because the docker compose file expects certain environment variables to be set.

A skeleton looks like this:

```bash
#!/bin/bash
export DOMAIN=$YOUR_DOMAIN$
export GOOGLE_CLIENT_SECRET=$YOUR_GOOGLE_CLIENT_SECRET$
export GOOGLE_CLIENT_ID=$YOUR_GOOGLE_CLIENT_ID$
```
