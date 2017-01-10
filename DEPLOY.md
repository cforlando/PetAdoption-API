## Deploying Pet Adoption

The current deployment steps involve setting up a cron job on a Docker host.

### 1. Check out repository on Docker host
*TODO:* perhaps provide a url to docker host

### 2. Create `envvars.sh` (see below)

A shell script used to determine the environment for the cron job. 
We need this because the docker compose file expects certain environment variables to be set.

* should be saved in the project's directory

A skeleton looks like this:

```bash
#!/bin/bash

# DOMAIN and ASSETS_DOMAIN should include `http://` or `https://`
export DOMAIN=$YOUR_DOMAIN$
# domain that images are hosted under. Most likely to be provided by AWS
export ASSETS_DOMAIN=$YOUR_ASSETS_DOMAIN$

# Amazon AWS S3 credentials
export AWS_ACCESS_KEY_ID=$YOUR_AWS_ACCESS_KEY$
export AWS_SECRET_ACCESS_KEY=$YOUR_AWS_ACCESS_KEY$
export S3_PROD_BUCKET_NAME=$YOUR_AWS_BUCKET_NAME$

# Google API credentials can be obtained at https://console.developers.google.com/apis/credentials
export GOOGLE_CLIENT_SECRET=$YOUR_GOOGLE_CLIENT_SECRET$
export GOOGLE_CLIENT_ID=$YOUR_GOOGLE_CLIENT_ID$
# (optional)
export GOOGLE_MAPS_KEY=$YOUR_GOOGLE_MAPS_KEY$
```
### 3. Enable auto-updating

To start the auto updating cron job, run:

`npm run start-auto-update`

To stop:

`npm run stop-auto-update`


### 4. Execute `start_services.sh`
execute `sh ./start_services.sh` or `npm run docker`
