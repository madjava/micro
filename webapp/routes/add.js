const { Router } = require('express');
const restify = require('restify-clients');
const { dns } = require('concordant')();
const router = Router();
let clients;

router.get('/', (req, res) => {
    res.render('add', { first: 0, second: 0, result: 0 });
});

router.post('/calculate', resolve, respond);

function resolve(req, res, next) {
    if (clients) {
        return next();
    }
    const adderservice = `_main._tcp.adderservice.micro.svc.cluster.local`;
    const auditservice = `_main._tcp.auditservice.micro.svc.cluster.local`;

    dns.resolve(adderservice, (err, locs) => {
        if (err) {
            return next(err);
        }
        const { host, port } = locs[0];
        const adder = `${host}:${port}`;

        dns.resolve(auditservice, (err, locs) => {
            if (err) {
                return next(err);
            } 
            const { host, port } = locs[0];
            const audit = `${host}:${port}`;

            clients = {
                adder: restify.createJSONClient({ url: `http://${adder}` }),
                audit: restify.createJSONClient({ url: `http://${audit}` })
            }
            next();
        });
    });
}

function respond(req, res, next) {
    const { first, second } = req.body;
    clients.adder.get(`/add/${first}/${second}`, (err, svcReq, svcRes, data) => {
        if (err) {
            return next(err);
        }
        const { result } = data;
        const payload = {
            calc: `${first} + ${second}`,
            calcResult: result
        };
        
        clients.audit.post('/append', payload, (err) => {
            if (err) console.error(err);
        });
        res.render('add', { first, second, result });
    });
}

module.exports = router;