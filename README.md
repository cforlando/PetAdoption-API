# cfo-pet-adoption-server
MongoDB/Express mockup server

Current API location: http://pet-adoption-server.herokuapp.com/api/v1/

### API
Method  | Endpoint                          | Notes
--------| --------------------------------- | ----------------------------------------------------------------
GET     | options/:species                  | JSON of all preselected options for given species
GET     | options/:species/:option          | JSON of given option for a given species
GET     | options/:species/:option/:paged   | JSON of given option for a given species in pages. Page size defaults to 10. This can be changed via query argument (i.e. "/options/dog/breed/1?pageSize=15")
GET     | schema/:species                   | returns JSON representation of a schema. Currently includes dog and cat schema
GET     | list/:species                     | ex: '/list/dog' will show all saved dog species
POST    | save/                             | fields will be saved as provided. Must match schema definition
POST    | query/                            | will match given parameters 
POST    | query/:paged                      | will match given parameters with paged results

#### Queries
You'll need to send the data as an `application/json` and specify so in the header `Content-type` if this isn't set so already.

##### Additinal fields you can set:

Name        | Type            | Description
------------| ----------------| ----------------------------------------------------------
matchStart  | Array <String>  | Requires the fields specified in the array to match the beginning
matchEnd    | Array <String>  | Requires the fields specified in the array to match the ending
ignoreCase  | Array <String>  | Allows the fields specified to ignore casing
pageSize    | Number          | (only meaningful when querying by page) Defaults to 10

###### More Notes
