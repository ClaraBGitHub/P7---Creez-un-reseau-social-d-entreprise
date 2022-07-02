const mongoose = require('mongoose');

const postSchema = mongoose.Schema({ // Nous créons un schéma de données qui contient les champs souhaités pour chaque sauce, indique leur type ainsi que leur caractère (obligatoire ou non). Pour cela, on utilise la méthode Schema mise à disposition par Mongoose. 
    userId : { type : String, required : true },
    subject : { type : String, required : true },
    description : { type : String, required : true },
    imageUrl : { type : String },
    likes : { type : Number, required : true, default: 0},
    dislikes : { type : Number, required : true, default: 0},
    usersLiked : { type : Array, required : true },
    usersDisliked : { type : Array, required : true },
});

module.exports = mongoose.model('Post', postSchema); // Permet d'exporter le modèle Mongoose, le rendant par là même disponible pour notre application Express.