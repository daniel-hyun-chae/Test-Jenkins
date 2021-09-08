const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const agg = [
    {
        '$project': {
            'equipmentKey': 0,
            'equipmentTypeKey': 0,
            'equipmentClassKey': 0
        }
    }, {
        '$limit': 10
    }
];

let result;

MongoClient.connect(
    'mongodb://10.78.114.232:27017/pasx-archive?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false',
    { useNewUrlParser: true, useUnifiedTopology: true },
    async (connectErr, client) => {
        assert.equal(null, connectErr);
        const coll = client.db('archive').collection('equipmentLogs');
        result = await coll.aggregate(agg);
        await result.forEach((test) => {
            console.log(test)
        })
        client.close();
    });


