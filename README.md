## Synopsis

The Pet Adoption API is a project using the MEAN stack. 
The database and API are currently hosted in Azure Platform (via Mlab and Bitnami). 
Image assests are stored with Amazon S3.

## Motivation

Nobody likes to see animals be put down due to overcrowding at animal control centers and shelters. 
We would like to see animals at these facilities be adopted at a much higher rate, 
and for those animals who were lost and found, for their rightful owners to be reunited with them once more. 
We would like to thank the City of Lady Lake for their wonderful contribution to the project, as they are the project's pilot city. 
For that, we are ever grateful!

## Installation

### via Docker 

If you are new to containers, run through the Docker hello world here: https://docs.docker.com/engine/tutorials/dockerizing/

To use Docker Compose to run the PetApi and Mongo services together:

1.  Look at the instructions in [`DEPLOY.md`](DEPLOY.md).
2. `./start_services.sh` or `docker-compose up --build -d`
    - `./stop_services.sh` or `docker-compose stop`

or 

1. `npm run start-auto-update`
    - `npm run stop-auto-update` to stop auto-updates
2. `npm run docker`

**TODO / Warning** - the mongo container is being started without the `--auth` flag, which probably makes it less secure than you want.

### Manually

#### 1. `git clone https://github.com/cforlando/PetAdoption-API.git && cd ./PetAdoption-API`

#### 2. Setup Environment
To really utilize all the features, you'll need to defined all of the environment variables.
The high of amount of dependencies was intended to allow the app to be configured and hosted in the most cost effective manner.
As of right now, the bare minimum required is: 
- `MONGODB_URI`. This can be remote (ie [mlab](http://mlab.com)) or local
    - The URL should look something like `username:user_pw@database_domain:port/db_name`
    

##### Setup MongoDB
on Linux, `sudo apt-get install mongodb` or you can use a free service such as [mlab](https://mlab.com)

##### create an `.env` file
You can also create an `.env` file in the project directory. 
Feel free to ask me for my `.env` file for an example.
It should look similar to the following. You can also set these environment variables by any other means:
```
DOMAIN=http://localhost:8080
# `DEVELOPMENT_ENV` flag allows login bypass
DEVELOPMENT_ENV=true
PORT=8080
HTTPS_PORT=8443
SERVER_SESSION_SECRET=cfo-petadoption-api

MONGODB_URI=localhost

# feel free to change this to your domain (ie the url of the uploads directory)
# 
ASSETS_DOMAIN=https://dev-cfo.s3.amazonaws.com

# As of now, you'll need this if you intend on uploading images
AWS_ACCESS_KEY_ID= XXXXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY= XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# and you'll need to define the buckets that you'll want to use 
S3_PROD_BUCKET_NAME=XXXXXXX
S3_DEV_BUCKET_NAME=dev-cfo
S3_TEST_BUCKET_NAME=test-cfo

# You can find this via https://console.developers.google.com/apis/dashboard
# This is used for preferences/settings on a per basis user and minimal authentication
GOOGLE_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_AUTH_CALLBACK=http://localhost:8080/auth/google/callback

# You can find this via https://console.developers.google.com/apis/dashboard
# This is used for front-end map input functionality
GOOGLE_MAPS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# dictionary object defining order of propers (taken from https://gist.github.com/JohnLeeroy/9ce15afc258b8acaf4dce45962801bd1)
DEFAULT_PROP_ORDER={"images":0,"petName":3,"species":4,"petId":3,"activityLevel":17,"actQuickly":11,"adoptable":10,"age":8,"caseActive":2,"caseNumber":1,"color":13,"crateTrained":18,"currentShots":19,"declawed":20,"description":15,"goodWithCats":21,"goodWithDogs":22,"goodWithKids":23,"hairLength":24,"houseTrained":25,"intakeDate":14,"lost":26,"lostGeoLat":37,"lostGeoLon":28,"microchip":30,"microchip_number":31,"primaryBreed":5,"purebred":27,"secondaryBreed":6,"sex":7,"shelterAddrCity":30,"shelterAddrLine1":31,"shelterAddrLine2":32,"shelterAddrSt":33,"shelterAddrZip":34,"shelterContact":35,"shelterEmail":36,"shelterGeoLat":37,"shelterGeoLon":38,"shelterId":39,"shelterName":16,"shelterPhone":41,"shelterUrl":42,"size":9,"spayedNeutered":12,"specialNeeds":45}
```


#### 3. Install repo
Run `npm install` or `yarn` 
After this, the server should be ready go (`npm start`)

## API Reference

Current API locations: 
- [pet-adoption-server.herokuapp.com](https://pet-adoption-server.herokuapp.com)
    - [https://pet-adoption-server.herokuapp.com/api/v1](https://pet-adoption-server.herokuapp.com)
    - [https://pet-adoption-server.herokuapp.com/api/v2](https://pet-adoption-server.herokuapp.com) (for reduced response data)
- [pets.codefororlando.com](http://pets.codefororlando.com)
    - [pets.codefororlando.com/api/v1/](http://pets.codefororlando.com)
    - [pets.codefororlando.com/api/v2/](http://pets.codefororlando.com) (for reduced response data)
    - The subdomain (***pets***.codefororlando.com) will change in the upcoming weeks to: [***petadoption***.codefororlando.com](http://petadoption.codefororlando.com)

:xxxxx = dynamic field that must be specified within the endpoint itself

Method  | Endpoint                                                | Notes
--------| ------------------------------------------------------- | ----------------------------------------------------------------
POST    | /species/all/query                                                  | will match given parameters
POST    | /species/all/query/:pageNumber                                      | will match given parameters with paged results
GET     | /species/all/animals/list                               | will show all saved species
GET     | /species/:speciesName/animals/list                               | will show all saved species
POST    | /species/:speciesName/animals/save                              | fields will be saved as provided. Must match schema definition and should be of `multipart/form-data`. Responds with saved animal data
POST    | /species/:speciesName/animals/save/json                              | fields will be saved as provided. Must match schema definition and should be of `application/json` Content-Type. Responds with saved animal data
POST    | /species/:speciesName/animals/remove                                    | deletes pet as specified by `petId` or `petName`
GET     | /species/:speciesName/animals/list                  | ex: '/list/dog' will show all saved dog species
GET     | /species/:speciesName/animals/list/:pageNumber                          | paginated route for list/:speciesName endpoint
GET     | /species/:speciesName/options                                   | JSON of all preselected options for given species
GET     | /species/:speciesName/options/:option                           | JSON of given option for a given species
GET     | /species/:speciesName/options/:option/:pageNumber               | JSON of given option for a given species in pages. Page size defaults to 10. This can be changed via query argument (i.e. "/options/dog/breed/1?pageSize=15")
GET     | /species/:speciesName/model                                     | provides JSON of model layout and meta data for species
POST    | /species/:speciesName/model/save                              | updates global model of pet in addition to saving data. Must match model format and should be of `application/json` Content-Type. Responds with saved species data
POST    | /species/:speciesName/model/create                              | creates a new species with provided fields. Should be of `application/json` Content-Type. Responds with saved species data
POST    | /species/:speciesName/model/remove                              | removes specified species
GET     | /species/all/list                                                | JSON array of possible species

#### Queries


##### Additional POST fields you can set:

Name           | Type            | Description
---------------| ----------------| ----------------------------------------------------------
ignoreCase     | (String) Array  | Allows the fields specified to ignore casing
matchStartFor  | (String) Array  | Requires the fields specified in the array to match starting from the beginning (prepends a '^' line start regex meta-character)
matchEndFor    | (String) Array  | Requires the fields specified in the array to match from the ending (appends a '$' line end regex meta-character)
properties     | (String) Array  | Will only supply fields specified in array
pageSize       | Number          | Defaults to 10 (only meaningful when making paged query)

##### Additional GET request parameters you can set:

Name           | Type            | Description
---------------| ----------------| ----------------------------------------------------------
pageSize       | Number          | Defaults to 10 (only meaningful when making paged query)
properties     | (String) Array  | Will only supply fields specified in array. ex: `?properties=['species','petName','sex']` (Must not include spaces between field names)


###### More Notes

- `api/v2` will only send values for request animals. 
- `api/v1` will send the value for an animal property as well as an example, default value, type, etc. as available.


## Developer Notes
- `gulp-utils` provides easy compilation of javascript, stylus, and pug/jade files.
    + you can can read more about how it works on its [github repo](https://github.com/khalidhoffman/gulp-utils)
    + `gulp --tasks` shows a list of all possible tasks, but you'll probably only want to use:
        - `gulp build-webpack` (for compiling web-interface js)
        - `gulp pug-html` (for angular template files)
        - `gulp stylus` (for style overrides)
- To run the tests, `npm run test`
- See [CONTRIBUTING.md](https://github.com/cforlando/PetAdoption-API/blob/master/CONTRIBUTING.md) for contribution guidelines

## Contributors

If you would like to join the API group, our contact info is below.  You can also check out the other projects Code for Orlando has been working on @ (https://github.com/cforlando) and (http://codefororlando.com/) <br />

**Luis Moraguez** (lmoraguez@kissimmee.org) - Slack (@lmoraguez) - API Group Lead <br />
**Eric Fisher** (EricJFisher@Live.com) - Slack (@ericjfisher) <br />
**Andrew Studnicky** (a.j.studnicky@gmail.com) - Slack (@studnicky) <br />
**Khalid Hoffman** - Slack (@khalidhoffman) <br />
**Jim Sandridge** - Twitter (@zero_map) <br />
**Tim Ferrell** - Twitter (@ferrell_tim)

## License

Project is governed by the MIT License
