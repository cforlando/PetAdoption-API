## Synopsis

The Pet Adoption API is a project using the ASP.NET WebAPI and MVC stack.  Project is set and built with Visual Studio 2015 Community Edition as it is open-source. Database and API hosted in Azure Platform.

## Motivation

Nobody likes to see animals be put down due to overcrowding at animal control centers and shelters.  We would like to see animals at these facilities be adopted at a much higher rate, and for those animals who were lost and found, for their rightful owners to be reunited with them once more.  We would like to thank the City of Lady Lake for their wonderful contribution to the project, as they are the project's pilot city.  For that, we are ever grateful!

## Installation

run `npm install`. Sudo privileges may be necessary.

## API Reference

Current API location: http://cfo-pet-adoption-server.eastus.cloudapp.azure.com/api/v1/

Current API location: http://cfo-pet-adoption-server.eastus.cloudapp.azure.com/api/v2/ (for reduced response data)

:xxxxx = dynamic field that must be specified within the endpoint itself

Method  | Endpoint                               | Notes
--------| -------------------------------------- | ----------------------------------------------------------------
GET     | species/                               | JSON array of possible species
GET     | options/:species                       | JSON of all preselected options for given species
GET     | options/:species/:option               | JSON of given option for a given species
GET     | options/:species/:option/:pageNumber   | JSON of given option for a given species in pages. Page size defaults to 10. This can be changed via query argument (i.e. "/options/dog/breed/1?pageSize=15")
GET     | schema/:species                        | returns JSON representation of a schema. Currently includes dog and cat schema
GET     | list/                                  | will show all saved species
GET     | list/:species                          | ex: '/list/dog' will show all saved dog species
GET     | list/:species/:pageNumber              | paginated route for list/:species endpoint
GET     | model/:species                         | provides JSON of model layout and meta data for species
POST    | save/                                  | fields will be saved as provided. Must match schema definition and should be of `multipart/form-data`. Responds with saved animal data
POST    | save/json                              | fields will be saved as provided. Must match schema definition and should be of `application/json` Content-Type. Responds with saved animal data
POST    | save/model                             | updates global model of pet in addition to saving data. Must match model format and should be of `application/json` Content-Type. Responds with saved animal data
POST    | query/                                 | will match given parameters 
POST    | query/:pageNumber                      | will match given parameters with paged results
POST    | remove/                                | deletes pet as specified by `petId` or `petName`

#### Queries

Additional fields you can set:

Name           | Type            | Description
---------------| ----------------| ----------------------------------------------------------
matchStartFor  | (String) Array  | Requires the fields specified in the array to match starting from the beginning (prepends a '^' line start regex meta-character)
matchEndFor    | (String) Array  | Requires the fields specified in the array to match from the ending (appends a '$' line end regex meta-character)
ignoreCase     | (String) Array  | Allows the fields specified to ignore casing
pageSize       | Number          | Defaults to 10 (only meaningful when making paged query) 

###### More Notes

`api/v2` will only send values for request animals. `api/v1` will send the value for an animal property as well as an example, default value, type, etc. as available. 

## Tests

***TODO** More tests needed


## Developer Notes
- `gulp-utils` provides easy compilation of javascript, stylus, and pug/jade files.
    + you can can read more about how it works on its [github repo](https://github.com/khalidhoffman/gulp-utils.git)
    + `gulp --tasks` shows a list of all possible tasks, but you'll probably only want to use `gulp build-js`

## Contributors

If you would like to join the API group, our contact info is below.  You can also check out the other projects Code for Orlando has been working on @ (https://github.com/cforlando) and (http://codefororlando.com/) <br />

**Luis Moraguez** (lmoraguez@kissimmee.org) - Slack (@lmoraguez) - API Group Lead <br />
**Eric Fisher** (EricJFisher@Live.com) - Slack (@ericjfisher) <br />
**Andrew Studnicky** (a.j.studnicky@gmail.com) - Slack (@studnicky)

## License

Project is governed by the MIT License
