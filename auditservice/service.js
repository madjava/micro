const { MongoClient } = require('mongodb');
const { dns } = require('concordant')();

module.exports = service;

function service() {
    const dbName = 'audit';
    let db;

    setup();

    function setup() {
        const mongo = '_main._tcp.mongo.micro.svc.cluster.local';
        dns.resolve(mongo, (err, locs) => {
            if (err) {
                return console.error(err);
            }
            const { host, port } = locs[0];
            const url = `mongodb://${host}:${port}/${dbName}`;
            MongoClient.connect(url, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }, (err, client) => {
                if (err) {
                    console.log('failed to connect to MongoDb retrying in 100ms');
                    return setTimeout(setup, 100);
                }
                db = client.db(dbName);
                client.on('close', () => db = null);
            });
        });
    }

    function append(args, cb) {
        if (!db) {
            return cb(Error('No database connection'));
        }
        
        const audit = db.collection('audit');
        const data = {
            ts: Date.now(),
            calc: args.calc,
            result: args.calcResult
        };
        audit
            .insertOne(data, (err, result) => {
                if (err) {
                    return cb(err);
                }
                cb(null, { result: result.toString() });
            });
    }

    function list(args, cb) {
        if (!db) {
            return cb(Error('No database connection'));
        }
        const audit = db.collection('audit');
        audit
            .find({}, { limit: 10 })
            .toArray((err, docs) => {
                if (err) {
                    return cb(err);
                }
                cb(null, { list: docs });
                // client.close();
            });
    }

    return { append, list }
}