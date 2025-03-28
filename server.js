const e = require('express');
const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const port = 3000;
const cors = require('cors');
const knex = require('knex')

const db = knex ({
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      user: 'prashantdang',
      password: '',
      database: 'smart-brain',
    },
  });

// 

app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
    res.send('Server is running');
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid){
            return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0]);
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong credentials');
        }
    })
    .catch(err => res.status(400).json('wrong credentials'));
});

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password, saltRounds);
    console.log(hash);  
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0].email,
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
   .catch(err => res.status(400).json('unable to register'));
}
);


app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    db.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
            found = true;
            return res.json(user[0]);
        }
        if(!found){
            res.status(400).json('not found');
        }
    })
    .catch(err => res.status(400).json('error getting user'));
});

app.put('/image', (req, res) => {
    const { id } = req.body;
    let found = false;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')  
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('unable to get entries'));
});

app.listen(port, () => {    
    console.log(`Server is running on port ${port}`);
});

