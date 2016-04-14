require('./core/server').listen();
// require('./core/csv-parser').parseSchema({
//     readPath: [
//         require('path').resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
//         require('path').resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
//     ],
//     cache: true,
//     done: function(){}
// });