const { MongoClient } = require('mongodb');
const { dns } = require('concordant')();

module.exports = service;

function service() {
    let db;
    const dbName = 'events';

    setup();

    function setup() {
        const mongo = '_main._tcp.mongo.micro.svc.cluster.local';
        dns.resolve(mongo, (err, locs) => {
            if (err) {
                return console.error(err);
            }
            const { host, port } = locs[0];
            const url = `mongodb://${host}:${port}/${dbName}`;
            MongoClient.connect(url, (err, client) => {
                if (err) {
                    console.log('failed to connect to MongoDB retrying in 100ms');
                    setTimeout(setup, 100);
                    return;
                }
                db = client.db(dbName);
                client.on('close', () => db = null);
            });
        });
    }

    function record(args, cb) {
        if (!db) {
            return cb('No database conection');
        }
        const events = db.collection(dbName);
        const data = {
            ts: Date.now(),
            eventType: args.type,
            url: args.url
        };
        events.insertOne(data, (err, result) => {
            if (err) {
                return cb(err);
            }
            cb(null, result);
        });
    }
    
    function summary(args, cb) {
        if (!db) {
            return cb('No database connection')
        }
        const summary = {};
        const events = db.collection(dbName);
        events.find({}).toArray((err, docs) => {
            if (err) {
                return cb(err);
            }

            docs.forEach((doc) => {
                if (!summary[doc.url]) {
                    summary[doc.url] = 1;
                } else {
                    summary[doc.url]++;
                }
            });
            cb(null, summary);
        });
    }

    return {
        record, summary
    }
}