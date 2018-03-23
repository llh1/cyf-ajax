const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/cyf');
const Schema = mongoose.Schema;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = process.env.PORT || 8080;
const router = express.Router();
const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
};

const Clipboard = mongoose.model('Clipboard', new Schema({ 
    text: String, 
    title: String 
}));

const Message = mongoose.model('Message', new Schema({
    content: String,
    datetime: String
}));

router.get('/greetings', function(req, res) {
    const greetings = [
        "你好世界", "Hallo wereld", "Hello world", "Bonjour monde",
        "Hallo Welt", "γειά σου κόσμος", "Ciao mondo", "こんにちは世界",
        "여보세요 세계", "Olá mundo", "Здравствулте мир", "Hola mundo"
    ];

    res.send(greetings[Math.ceil(Math.random() * greetings.length - 1)]);
});

router.post('/clipboard', function(req, res) {
    const text = req.body.text;
    const title = req.body.title;

    if(!text || !title) {
        return res.json({ result: 'Error, text and title are mandatory' });
    }

    Clipboard.findOneAndUpdate({ title: title }, { text: text }, { 
        upsert: true, new: true, setDefaultsOnInsert: true 
    }, function(error, result) {
        if (error) return res.send(error);
        res.json({ result: "Clipboard saved" });
    });
});

router.get('/clipboard', function(req, res) {
    const title = req.query.title;
    Clipboard.findOne({ 'title': title }, 'text', function(error, clip) {
        if(error) return res.send(error);
        res.send(clip.text);
    });
});

router.get('/messages', function(req, res) {
    Message.find(function(error, messages) {
        if(error) res.send(error);

        const result = messages.map(m => ({
            content: m.content,
            datetime: m.datetime
        }));

        res.json(result);
    });
});

router.post('/messages', function(req, res) {
    const message = new Message({
        content: req.body.content,
        datetime: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    });

    message.save(function(error) {
        if(error) res.send(error);
        res.json({ result: 'Message added' });
    });
});

function buildApiDefinition() {
    return [
        'GET /api/greetings',
        'GET /api/clipboard?title=myClipboard',
        "POST /api/clipboard {'title': 'myClipboard', 'text': 'some text'}",
        'GET /api/messages',
        "POST /api/messages {'content': 'my message'}"
    ];
}

router.get('/', function(req, res) {
    res.json({apiEndpoints: buildApiDefinition()});
});

app.get('/', function(req, res) {
    res.json({apiEndpoints: buildApiDefinition()});
});

app.use(allowCrossDomain);
app.use('/api', router);
app.listen(port);

console.log('Server started and listening on port ' + port);