const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();

const db = new sqlite3.Database('./db/Database.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Conexao ao Database feita com sucesso');
});
/* -----------------------------------------------------------------------\
| Funcao que seleciona um usuario dada uma entrada, a chave de selecao eh |
| o email e o ID do usuario.                                              |
\------------------------------------------------------------------------*/
function findUser(email, callback) {

    let sql = 'SELECT * FROM usuarios WHERE Email = ?;';
    console.log('rodando findUser')

    db.get(sql, [email], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log('row', row)
        callback(row)
        return;
    });
}

function findPacote(nomePacote, callback) {
    let sql = 'SELECT * FROM pacotes WHERE NomePacote = ?;';

    db.get(sql, [nomePacote], (err, row) => {
        if (err) return console.error(err.message);
        console.log('pacotes: ', row)
        return callback(row)
    });
}

/* -----------------------------------------------------------------------\
| Funcao que seleciona um usuario dada uma entrada, a chave de selecao eh |
| o email e o ID do usuario.                                              |
\------------------------------------------------------------------------*/
function createUser(user, callback) {

    let sql = 'INSERT INTO usuarios(Email, Nome)' + 'VALUES (?,?);';

    db.get(sql, [user.email, user.nome], (err) => {
        if (err) {
            console.log(err.message)
            throw err;
        }
        callback(true)
        return;
    });
}

function getMax(callback) {
    let sqlId = 'SELECT (MAX(IDViagem)+1) as ID FROM pacotes';

    //Captura o ultimo valor de ID da tabela para gerar o novo ID
    db.get(sqlId, [], (err, row) => {
        if (err) {
            throw err;
        }
        console.log('row getMax', row)
        return callback(row.ID + Math.round(Math.random() * 10000))
    });
}

function inserePacotes(idUser, idPassagem, idHotel, nomePacote, callback) {

    var sqlPacote = 'INSERT INTO pacotes(IDUsuario,IDViagem,IDHotel,NomePacote)' + 'VALUES(?,?,?,?);';

    db.run(sqlPacote, [idUser, idPassagem, idHotel, nomePacote], (err, row) => {
        if (err) {
            throw err;
        }
        return callback()
    });
}

function insereHoteis(idHotel, idUser, hotelName, dataSaida, dataRetorno) {



    var sqlHotel = 'INSERT INTO hoteis(idHotel,idUser,hotelName,dataSaida,dataRetorno)' + 'VALUES(?,?,?,?,?);';

    db.run(sqlHotel, [idHotel, idUser, hotelName, dataSaida, dataRetorno], (err) => {
        if (err) {

            throw err;
        }
    });


}

function insereViagens(idViagem, origem, destino, ida, volta, idUser) {



    var sqlViagem = 'INSERT INTO viagens(IDViagem,AeroportoOrigem,AeroportoDestino,DataIda,DataVolta,IDUsuario)' + 'VALUES(?,?,?,?,?,?);';

    db.run(sqlViagem, [idViagem, origem, destino, ida, volta, idUser], (err) => {
        if (err) {

            throw err;
        }
    });


}

function insereAtracoes(atracao, idUsuario, idPacote, callback) {

    var destinos = atracao.id;
    var nome = atracao.nome;



    var sqlViagem = 'INSERT INTO destinos(IDDestinos,IDUsuarios,NomesDestinos,IDPacote)' + 'VALUES(?,?,?,?);';

    db.run(sqlViagem, [destinos, idUsuario, nome, idPacote], (err) => {
        if (err) {
            throw err;
        }
        callback(true)
        return;
    });


}

function insereUser(email, nome, callback) {
    console.log('rodando insereUser')

    var sql = 'INSERT INTO usuarios(Email,Nome)' + 'VALUES(?,?);';

    db.run(sql, [email, nome], (err, row) => {
        if (err) {
            console.log(err.message)
            throw err;
        }
        callback(row)
    });
}

function insereDados(emailUser, nomePacote, res, pacotes) {
    if (pacotes.passagens[0] !== undefined) {
        console.log('tem passagem', pacotes.passagens[0])
        getMax((id) => {
            var idPassagem = id
            var origem = pacotes.passagens[0].aeroportoOrigem;
            var destino = pacotes.passagens[0].aeroportoDestino;
            var ida = pacotes.passagens[0].dataIda;
            var volta = pacotes.passagens[0].dataVolta;
            console.log('id passagem', id)

            insereViagens(idPassagem, origem, destino, ida, volta, emailUser);
        });
    } else {
        console.log('nao tem passagem')
        var idPassagem = ''
    }

    if (pacotes.hoteis[0] !== undefined) {
        console.log('tem hotel', pacotes.hoteis[0])
        var idHotel = pacotes.hoteis[0].id;
        var hotelName = pacotes.hoteis[0].nome;
        var checkin = pacotes.hoteis[0].checkin;
        var checkout = pacotes.hoteis[0].checkout;

        insereHoteis(idHotel, emailUser, hotelName, checkout, checkin);
    } else {
        console.log('nao tem hotel')
        var idHotel = ''
    }

    inserePacotes(emailUser, idPassagem, idHotel, nomePacote, () => {
        console.log('comecando a inserir pacote')
        findPacote(nomePacote, async (result) => {
            console.log('achou pacote', result)
            var idPacote = result.IDPacote
            if (pacotes.atracoes.length === 0)
                res.send({ status: true })
            for (var i = 0; i < pacotes.atracoes.length; i++) {
                console.log('comecando a inserir atracoes')
                insereAtracoes(pacotes.atracoes[i], emailUser, idPacote, (value) => {
                    console.log(value)
                });
            }
            res.send({ status: true })
        })

    });
}

/* -----------------------------------------------------------------------\
|                    Vericia a conexao com o servidor                     |
\ -----------------------------------------------------------------------*/
router.get('/', (req, res, next) => {
    findPacote('teste', (result) => {
        res.send({ "status": true, "result": result })
    })
});

// -----------------------------------------------------------------------\\
// | Funcao que realiza o cadastro de novos usuarios no banco de dados    |
// | caso os dados recebidos estarem incorretos um erro sera retornado    |
// | caso o usuario ja exista no banco um erro sera apresentado.          |
// -----------------------------------------------------------------------\\
router.post('/cadastro', (req, res, next) => {

    var userCheck;
    findUser(req.body.email, (result) => {
        userCheck = result
        user = req.body;
        if (user == undefined) {
            res.send({ "status": false, "auth": false, "mensagem": "Houve um problema com o e-mail inserido!" });
        }
        else {
            if (userCheck !== undefined && userCheck.Email === user.email) {
                res.send({ "status": false, "auth": false, "mensagem": "O e-mail já está cadastrado no site!" });
            }
            else {
                createUser(req.body, (value) => {
                    findUser(req.body.email, (result) => {
                        res.send({ "status": true, "auth": true, "mensagem": "Usuário cadastrado com sucesso!", result });
                    })
                });

            }
        }
    });
});

/* -----------------------------------------------------------------------\
| Funcao que salva o pacote enviado e armazena as informacoes dos campos  |
| em suas respectivas tabelas.                                            |
\------------------------------------------------------------------------*/
router.post('/pacotes', (req, res, next) => {


    var pacotes = req.body;
    var nomePacote = pacotes.nome;

    var aux = undefined;
    findUser(pacotes.user, (result) => {
        aux = result;

        if (aux == undefined) {
            console.log('aux indefinido')
            insereUser(pacotes.user, pacotes.username, (resultado) => {
                findUser(pacotes.user, (result) => {
                    aux = result;
                    insereDados(aux.Email, nomePacote, res, pacotes)
                })
            });
        } else {
            console.log('aux definido', aux.Email, nomePacote, pacotes)
            insereDados(aux.Email, nomePacote, res, pacotes)
        }
    });
});

async function pegarHotel(elem) {
    const result = await db.get("SELECT * FROM hoteis WHERE IDHotel = ? AND IDUser = ?;", [elem.IDHotel, elem.IDUsuario]);
    return result;
}
async function pegarViagem(elem) {
    const result = await db.get("SELECT * FROM viagens WHERE IDViagem = ?", [elem.IDViagem]);
    return result;
}
async function pegarDestinos(elem) {
    db.all("SELECT * FROM destinos WHERE IDPacote = ?", [elem.IDPacote], (err, rows) => {
        return rows
    });
}

router.post('/recuperarPacotes', (req, res, next) => {

    //Pega aquele usuario 
    findUser(req.body.user, result => {
        var idUser = result.Email;
        db.serialize(function () {
            var array = [];
            db.all(`SELECT * FROM pacotes WHERE IDUsuario = '${idUser}'`, async function (err, rows) {
                if (err) console.log(err);
                let contador = 0;
                console.log('rows', rows)
                if (rows !== undefined) {
                    var objs = [];
                    await rows.forEach(async function (elem, index) {

                        var obj = {
                            hotel: undefined,
                            viagem: undefined,
                            destinos: []
                        }

                        obj.hotel = await pegarHotel(elem)

                        obj.viagem = await pegarViagem(elem)

                        obj.destinos = pegarDestinos(elem)


                        console.log('obj', obj)
                        if (index === rows.length - 1)
                            res.send({ "res": obj })
                    });
                } else {
                    res.send({ "res": [] })
                }
            });
        })
    });
});

router.post('/apagarPacote', (req, res, next) => {

    findUser(req.body.user, result => {
        var idUser = aux.Email;

        var sql = 'DELETE FROM pacotes WHERE IDUsuario = ?;';

        db.run(sql, [idUser], (err) => {
            if (err) {
                res.send({ status: false })
                throw err;
            }
            res.send({ status: true })
        });
    });
});


/* -----------------------------------------------------------------------\
| Funcao que salva o Destino que o usuario escolheu e armazena na tabela  |
| destinos do  banco de dados.                                            |
\------------------------------------------------------------------------*/
router.get('/sdestinos', (req, res, next) => {



    //Olhei as tags do site e considerei que o Bruno vai me mandar elas
    //mas também considerei que ele me manda o email do usuario da sessao
    //e tambem o nome que o usuario deu pro pacote
    var destino = req.body;

    //Encontra o ID do usuario dado seu email da sessao
    let aux = findUser(destino.user);
    let ID = aux.Email;

    //Encontra o id do pacote que o usuario esta olhando
    aux = findPacote(destino.nomePacote);
    let nomePacote = aux.NomePacote;
    let idPacote = aux.IDPacote;

    let sql = 'INSERT INTO destinos(IDDestinos, IDUsuarios, NomeDestinos, IDPacote)' + 'VALUES(?,?,?,?);';
    //Se o usuario nao criou um pacote na requisicao
    if (nomePacote == undefined) {
        db.run(sql, [destino.location_id, ID, destino.name, -1], (err, rows) => {
            if (err) {

                throw err;
            }
        });

        res.send({ "status": true, "result": true, "idDestino": destino.location_id, "idUser": ID });
    }
    else {
        db.run(sql, [destino.location_id, ID, destino.name, idPacote], (err, rows) => {
            if (err) {

                throw err;
            }
        });

        res.send({ "status": true, "result": true, "idDestino": destino.location_id, "idUser": ID });
    }
});

/* -----------------------------------------------------------------------\
| Funcao que salva o Hotel que o usuario escolheu e armazena na tabela    |
| destinos do  banco de dados.                                            |
\------------------------------------------------------------------------*/
router.get('/shotel', (req, res, next) => {

    //Considerando os campos do SQL, alem do nome do pacote
    var hotel = req.body;

    //Encontra o ID do usuario dado seu email da sessao
    let aux = findUser(destino.user);
    let ID = aux.Email;

    let sql = 'INSERT INTO hoteis(IDHotel,IDUser,HotelName,DataSaida,DataRetorno)' + 'VALUES(?,?,?,?,?);';

    db.run(sql, [hotel.location_id, ID, hotel.Ida, hotel.volta], (err, rows) => {
        if (err) {

            throw err;
        }
    });

    //Se o usuario colocar em um pacote
    if (hotel.nomePacote != undefined) {
        id = hotel.location_id;
        let sql = 'UPDATE pacotes SET IDHotel = ? WHERE NomePacote = ?;';
        db.run(sql, [id, hotel.nomePacote], (err, rows) => {
            if (err) {

                throw err;
            }
        });
    }

    res.send({ 'status:': true, 'result': true, 'idHotel': hotel.location_id, 'idUser': ID });
});

/* -----------------------------------------------------------------------\
| Funcao que salva a Passagem que o usuario escolheu e armazena na tabela |
| passagens do banco de dados.                                            |
\------------------------------------------------------------------------*/
//router.get('/spassagens', (err, res, next) => {
//    let db = new sqlite3.Database('./db/Database.db', (err) => {
//        if (err) {
//            return console.error(err.message);
//        }
//        console.log('Conexao ao Database feita com sucesso');
//    });

//    //Considerando os campos do SQL mais nome do pacote
//    var passagem = req.body;

//    //Encontra o ID do usuario dado seu email da sessao
//    let aux = findUser(destino.idUsuario);
//    let ID = aux.Email;

//});

/* -----------------------------------------------------------------------\
| Funcao que verifica se o usuario ja existe na base e alerta caso ele    |
| nao exista, caso exista um ok eh apresentado.                           |
\------------------------------------------------------------------------*/
router.post('/login', (req, res, next) => {



    findUser(req.body.email, (resultado) => {
        var user = resultado;
        if (user == undefined) {
            res.send({ "status": false, "auth": false, "mensagem": "E-mail não está cadastrado!" });
        }

        if (user.Email == req.body.email && user.Nome == req.body.nome) {
            res.send({ "status": true, "auth": true, "id": user.Email })
        }
    });
});

router.get('/info', (req, res, next) => {
    res.send({
        "status": true,
        "conexao": "conexão ao servidor feita com sucesso!"
    })
})



module.exports = router;


/* -----------------------------------------------------------------------\
| Funcao que inicia o banco de dados, passando seu caminho de arquivo     |
| e cria a tabela de usuarios. Esta funcao deve ser comentada depois      |
| de utilizada.                                                           |
\----------------------------------------------------------------------*/
/*
router.get('/users', (req, res, next) => {

    var path = './db/Database.db';
    var db = new sqlite3.Database(path, 'OPEN_READONLY');


    db.serialize(function () {
        console.log("Entrou no serialize");
        var array = [];
        db.all("SELECT * FROM usuarios", function (err, rows) {
            if (err) console.log(err);
            let contador = 0;
            rows.forEach(function (row) {
                array[contador] = row.ID + ';' + row.Email + ';' + row.Nome + ';';
                contador++;
            });
            console.log(rows);

            res.send (array);
        })
    })
});
*/
/* -----------------------------------------------------------------------\
| Funcao que inicia o banco de dados, passando seu caminho de arquivo     |
| e cria a tabela de usuarios. Esta funcao deve ser comentada depois      |
| de utilizada.                                                           |
\------------------------------------------------------------------------*/
/*
router.get('/create', (req, res, next) => {



    db.run('CREATE TABLE usuarios(ID INTEGER, Email TEXT, Nome TEXT);', function (err) {
        if (err) console.log(err.message);
        console.log("Sucesso");
    });




});
*/
// --------------------------------------------------------------------------\\
// | Funcao que popula o banco de dados com algumas tuplas. Deve ser apagada |
// | depois de utilizada.
// --------------------------------------------------------------------------\\
/*
router.get('/popula', (req, res, next) => {



    //let usuariosInseridos = [
    //    [1, "brunofurquim@email.com", "Bruno Furquim"],
    //    [2, "andresolla@email.com", "Andre Solla"],
    //    [3, "marcusvinicius@email.com", "Marcus Vinicius"],
    //    [4, "gabrielbrandao@email.com", "Gabriel Brandao"]
    //];

    let usuario = [2, "andresolla@email.com", "Andre Solla"];

    let insertQuery = 'INSERT INTO usuarios (ID, Email, Nome)' + 'VALUES (?,?,?)';

    db.run(insertQuery, usuario, (err) => {
        if (err) {
            return console.log(err.message);
        }
        console.log('Linha adicionada no banco: ${this.lastID}');
    });

    //TODO
    //let statement = db.prepare(insertQuery);

    //for (var i = 0; i < usuariosInseridos.lenght; i++) {
    //    statement.run(usuariosInseridos[i], function (err) {
    //        if (err) throw err;
    //    });
    //}

    //statement.finalize();



});
*/

/*

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
*/
//TOKEEP
//router.get('/users', (req, res, next) => {

//    //let db = new sqlite3.Database('./db/Database.db', (err) => {
//    //    if (err) {
//    //        return console.error(err.message);
//    //    }
//    //    console.log('Conexao ao Database feita com sucesso')
//    //});

//    var usuariosBD = function (callback) {
//        var db = new sqlite3.Database('./db/Database.db', sqlite3.OPEN_READONLY);

//        db.serialize(function () {
//            db.all("SELECT * FROM usuarios", function (err, allRows) {
//                if (err != null) {
//                    console.log(err);
//                    callback(err);
//                }
//                console.log(util.inspect(allRows));

//                callback(allRows);
//                
//            });
//        });
//    }




//    //db.all("SELECT * FROM usuarios", function (err, rows) {
//    //    rows.forEach(function (row) {
//    //        console.log(row.ID, row.Emai, row.Nome);
//    //    });
//    //    callback(rows);
//    //});

//    //function callback(row) {
//    //    console.log(row);
//    //}


//    ////let sqlAll = 'SELECT * FROM usuarios'; 

//    ////db.all(sqlAll, function(err, rows) {
//    ////  if(err){
//    ////    throw err;
//    ////    }
//    ////    console.log(util.inspect(rows));
//    ////});

//    ////res.send({ "status": false, "auth": false, "mensagem": "O e-mail já está cadastrado no site!" });


//    //


//});