import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        //default port number to connect mongodb 27017
        // using await because will read from DB asynchronize
        const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
        const db = client.db('my-blog-db');

        await operations(db);
        client.close();
    } catch (error) {
        // 500 is for internal server error
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articlesInfo);
    }, res)
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        });
        const updatedArticledInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticledInfo);
    }, res)
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async(db) => {
        const articlesInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                comments: articlesInfo.comments.concat({username, text}),
            },
        }); 
        const updatedArticledInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticledInfo);
    }, res)
})

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));