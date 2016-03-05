# cfo-pet-adoption-server
MongoDB/Express mockup server

Method  | Endpoint        | Notes
--------| --------------- | ----------------------------------------------------------------
GET     | schema/         | returns JSON represenation of the dog schema (for demo purposes)
GET     | list/:species   | (i.e. '/list/dog') will show all saved dog species
POST    | save/           | fields will be saved as provided
POST    | query/:species  | (i.e. '/query/dog') will match given parameters (yes, the 'species' path parameter is kind of useless for this endpoint. Providing the species field in the request body is accomplishes the same thing)
