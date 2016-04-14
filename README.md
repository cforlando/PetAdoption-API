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
POST    | query/                            | (i.e. '/query/dog') will match given parameters (the 'species' path parameter is essentially useless. Providing the 'species' field in the request body yields the same result)

#### Queries
You'll need to send the data as an `application/json` and specify so in the header `Content-type` if this isn't set so already.

There are 3 additional fields you can set:
Type            | Name        | Description
----------------|-------------|------------------
Array <String>  | matchStart  | Requires the fields specified in the array to match the beginning
Array <String>  | matchEnd    | Requires the fields specified in the array to match the ending
Array <String>  | ignoreCase  | Allows the fields specified to ignore casing

###### More Notes
