# cfo-pet-adoption-server
MongoDB/Express mockup server

Current domain: pet-adoption-server.herokuapp.com

Method  | Endpoint                          | Notes
--------| --------------------------------- | ----------------------------------------------------------------
GET     | options/:species                  | JSON of all preselected options for given species
GET     | options/:species/:option          | JSON of given option for a given species
GET     | options/:species/:option/:paged   | JSON of given option for a given species in pages. Page size defaults to 10. This can be changed via query argument (i.e. "/options/dog/breed/1?pageSize=15")
GET     | schema/                           | returns JSON representation of the dog schema (for demo purposes)
GET     | list/:species                     | ex: '/list/dog' will show all saved dog species
POST    | save/                             | fields will be saved as provided. Must match schema definition
POST    | query/:species                    | (i.e. '/query/dog') will match given parameters (the 'species' path parameter is essentially useless. Providing the 'species' field in the request body yields the same result)
