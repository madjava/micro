const { dns } = require('concordant')();
const redis = require('redis');
const QNAME = 'eventservice';

module.exports = wiring;

function wiring(service) {
    const endpoint = '_main._tcp.redis.micro.svc.cluster.local';

    dns.resolve(endpoint, (err, locs) => {
        if (err) {
            return console.log(err);
        }
        const { port, host } = locs[0];
        pullFromQueue(redis.createClient(port, host));
    });

    function pullFromQueue(client) {
        client.brpop(QNAME, 5, function (err, data) {
            if (err) console.error(err);
            if (err || !data) {
                pullFromQueue(client);
                return;
            }
            const msg = JSON.parse(data[1]);
            const { action, url } = msg;
            const cmd = service[action];
            if (typeof cmd !== 'function') {
                pullFromQueue(client);
                return;
            }

            cmd(msg, (err, result) => {
                if (err) {
                    console.error(err);
                    pullFromQueue(client);
                    return;
                }
                if (!url) {
                    pullFromQueue(client);
                    return;
                }
                client.lpush(url, JSON.stringify(result), (err) => {
                    if (err) console.error(err);
                    pullFromQueue(client);
                });
            });
        });
    }
}