const { Router } = require('express');
const restify = require('restify-clients');
const { dns } = require('concordant')();
const router = Router();

let client;

router.get('/', resolve, respond);

function resolve(req, res, next) {
    if (client) {
        return next();
    }
    const auditservice = `_main._tcp.auditservice.micro.svc.cluster.local`;
    dns.resolve(auditservice, (err, locs) => {
        if (err) {
            return next(err);
        }
        const { host, port } = locs[0];
        client = restify.createJSONClient(`http://${host}:${port}`);
        next();
    });
}

function respond(req, res, next) {
    client.get('/list', (err, svcReq, svcRes, data) => {
        if (err) {
            return next();
        }
        res.render('audit', data);
    });
}

module.exports = router;