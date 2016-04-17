# cfo-pet-adoption-server
MongoDB/Express mockup server

Current API location: http://pet-adoption-server.herokuapp.com/api/v1/

Current API location: http://pet-adoption-server.herokuapp.com/api/v2/ (for reduced response data)

### API
Method  | Endpoint                               | Notes
--------| -------------------------------------- | ----------------------------------------------------------------
GET     | options/:species                       | JSON of all preselected options for given species
GET     | options/:species/:option               | JSON of given option for a given species
GET     | options/:species/:option/:pageNumber   | JSON of given option for a given species in pages. Page size defaults to 10. This can be changed via query argument (i.e. "/options/dog/breed/1?pageSize=15")
GET     | schema/:species                        | returns JSON representation of a schema. Currently includes dog and cat schema
GET     | list/:species                          | ex: '/list/dog' will show all saved dog species
GET     | list/:species/:pageNumber              | paginated route for list/:species endpoint
POST    | save/                                  | fields will be saved as provided. Must match schema definition. Responds with saved animal data
POST    | query/                                 | will match given parameters 
POST    | query/:pageNumber                      | will match given parameters with paged results

#### Queries
You'll need to send the data as an `application/json` and specify so in the header `Content-type` if this isn't set so already.

Additional fields you can set:

Name           | Type            | Description
---------------| ----------------| ----------------------------------------------------------
matchStartFor  | (String) Array  | Requires the fields specified in the array to match starting from the beginning (appends a '^' line start regex meta-character)
matchEndFor    | (String) Array  | Requires the fields specified in the array to match from the ending (appends a '$' line end regex meta-character)
ignoreCase     | (String) Array  | Allows the fields specified to ignore casing
pageSize       | Number          | Defaults to 10 (only meaningful when making paged query) 

###### More Notes

`api/v2` will only send values for request animals. `api/v1` will send the value for an animal property as well as an example, default value, type, etc. as available. 
