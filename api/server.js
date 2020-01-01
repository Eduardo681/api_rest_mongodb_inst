const express = require('express'),
    mongodb = require('mongodb'),
    multparty = require('connect-multiparty'),
    expressValidator = require('express-validator')
    objectId = require('mongodb').ObjectID,
    fs = require('fs');
const app = express();

// body-parser
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(expressValidator());
app.use(multparty());
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","GET , POST , PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers","content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
})
const port = 8080;
const db = new mongodb.Db(
    'instagram',
    new mongodb.Server("localhost", 27017, {})
);
app.get("/",(req,res)=>{
    res.send({msg:"ola"})
})
app.post("/api",(req,res)=>{
    let date = new Date();
    let time = date.getTime();
    let url_imagem = time+"_"+req.files.arquivo.originalFilename;
    let pathOrigem = req.files.arquivo.path;
    let pathDestino = "./uploads/"+url_imagem;
    
    fs.rename(pathOrigem,pathDestino,(err)=>{
        if(err){
            res.status(500).json({error: err});
            return;
        }
        let dados = {
            url_imagem: url_imagem ,
            titulo: req.body.titulo
        }
        db.open((err,mongoClient)=>{
            mongoClient.collection("postagens",(err,colection)=>{
                colection.insert(dados,(err,results)=>{
                    err ? res.json({"status": "erro"}): res.json({"status":"inclusão realizada com sucesso"});
                    db.close();
                });
            });
        });
    })

})
app.get("/api",(req,res)=>{
    
    db.open((err,mongoClient)=>{
        mongoClient.collection("postagens",(err,colection)=>{
            colection.find().toArray((err,results)=>{
                err ? res.json(err): res.json(results);
                db.close();
            })
        });
    });
});
app.get("/api/:id",(req,res)=>{
    db.open((err,mongoClient)=>{
        mongoClient.collection("postagens",(err,colection)=>{
            colection.find(objectId(req.params.id)).toArray((err,results)=>{
                err ? res.json(err): res.json(results);
                db.close();
            })
        });
    });
})
app.put("/api/:id",(req,res)=>{
    db.open((err,mongoClient)=>{ 
        mongoClient.collection("postagens",(err,colection)=>{
            colection.update(
                {_id : objectId(req.params.id)},
                { $push : {comentarios:{
                    id_comentario: new objectId(),
                    comentario: req.body.comentario
                }}},
                {},
                (err,results)=>{
                    err ? res.json(err): res.json(results);
                    db.close();
                }
                
            );
            
        });
    });
})
app.delete("/api/:id",(req,res)=>{
    db.open((err,mongoClient)=>{
        mongoClient.collection("postagens",(err,colection)=>{
            colection.update(
                {},
                {$pull: {
                    comentarios: {
                        id_comentario : objectId(req.params.id)
                    }
                }},
                {multi : true},
                (err,results)=>{
                    err ? res.json(err): res.json(results);
                    db.close();
                }
            );
        });
    });
})
app.get("/uploads/:image",(req,res)=>{
    let img = req.params.image;
    fs.readFile('./uploads/'+img,(err, content)=>{
        if(err){
            res.status(400).json(err);
            return;
        }
        res.writeHead(200,{"content-type": "image/jpg"})
        res.end(content);
    })
})
app.listen(port,()=>{
    console.log('Servidor HTTP esta escutando na porta ' + port);
});

