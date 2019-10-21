const restify = require('restify');
const { AUDITSERVICE_SERVICE_PORT } = process.env;

module.exports = wiring;

function wiring(service) {
    const server = restify.createServer();
    server.use(restify.plugins.bodyParser());

    server.post('/append', (req, res, next) => {
        const payload = req.body;
        if(!payload) {
            return res.send(Error('No data available'));
        }
        service.append(payload, (err, result) => {
            if (err) {
                return res.send(err);
            }
            res.send(result);
            next();
        });
    });

    server.get('/list', (req, res, next) => {
        service.list(req.params, (err, result) => {
            if (err) {
                return res.send(err);
            }
            res.send(200, result);
            next();
        });
    });

    server.listen(AUDITSERVICE_SERVICE_PORT, '0.0.0.0', () => {
        console.log('%s listerning at %s', server.name, server.url);
    });
}