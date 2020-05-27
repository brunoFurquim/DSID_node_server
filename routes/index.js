const express = require('express');
const path = require('path');

const router = express.Router();

function findUser(user) {
    var users = db.users;
    var elem = users.find(element => element.login == user.login);
    return elem;
}

var db = {
    "users": [
      {
        "id": 1,
        "login": "brunofurquim@email.com",
        "password": "senha123!"
      },
      {
        "id": 2,
        "login": "andresolla@email.com",
        "password": "senha456@"
      },
      {
        "id": 3,
        "login": "marcusvinicius@email.com",
        "password": "senha789#"
      },
      {
        "id": 4,
        "login": "gabrielbrandao@email.com",
        "password": "senha101112$"
      }
    ]
  }

router.get('/', (req, res, next) => {
    res.send({"status": true});
});

router.get('/users', (req, res, next) => {
    res.send(db);
});

router.post('/login', (req, res, next) => {
    var user = findUser(req.body);
    if (user == undefined) {
        res.send({"status": false, "auth": false, "mensagem": "E-mail não está cadastrado!"});
    }

    if (user.login == req.body.login && user.password == req.body.password) {
        res.send({"status": true, "auth": true, "id": user.id})
    } else {
        res.send({"status": true, "auth": false, "mensagem": "Senha incorreta!"})
    }
});

router.get('/info', (req, res, next) => {
    res.send({
        "status": true,
        "conexao": "conexão ao servidor feita com sucesso!"
    })
})

module.exports = router;