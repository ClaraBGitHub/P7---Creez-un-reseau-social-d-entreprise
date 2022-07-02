const Post = require('../models/post');
const fs = require('fs');

exports.createPost = (req, res, next) => {
  const postObject = req.body; // Pour ajouter un fichier à la requête, le front-end doit envoyer les données de la requête sous la forme form-data, et non sous forme de JSON. Le corps de la requête contient une chaîne post , qui est simplement un objet Post converti en chaîne. Nous devons donc l'analyser à l'aide de JSON.parse() pour obtenir un objet utilisable.
  delete postObject._id; // Delete id which is created by MongoDB
  const post = new Post({
    ...postObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  post.save()
    .then(() => res.status(201).json({ message: 'Post enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getAllPost = (req, res, next) => {
  Post.find()
    .then(posts => res.status(200).json(posts))
    .catch(error => res.status(400).json({ error }));
};

exports.getOnePost = (req, res, next) => {
  Post.findOne({ _id: req.params.id })
    .then(posts => res.status(200).json(posts))
    .catch(error => res.status(404).json({ error }));
};

exports.modifyPost = (req, res, next) => {
  const postObject = req.file ?
    {
      ...JSON.parse(req.body.post),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  Post.updateOne({ _id: req.params.id }, { ...postObject, _id: req.params.id }) // Le premier argument est l'objet de comparaison donc celui que l'on veut modifier, le 2nd argument est la nouvelle version de l'objet.
  // L'utilisation du mot-clé new avec un modèle Mongoose crée par défaut un champ_id . Utiliser ce mot-clé générerait une erreur, car nous tenterions de modifier un champ immuable dans un document de la base de données. Par conséquent, nous devons utiliser le paramètre id de la requête pour configurer notre Post avec le même _id qu'avant.
    .then(() => res.status(200).json({ message: 'Post modifié !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.deletePost = (req, res, next) => {
  Post.findOne({ _id: req.params.id }) // Dans cette fonction, nous utilisons l'ID que nous recevons comme paramètre pour accéder au Post correspondant dans la base de données;
  .then((post) => {
    if (!post) {
      res.status(404).json({
        error: new Error('No such Post!')
      });
    }
    if (post.userId !== req.auth.userId) {
      res.status(400).json({
        error: new Error('Unauthorized request!')
      });
    }
    const filename = post.imageUrl.split('/images/')[1]; // Nous utilisons le fait de savoir que notre URL d'image contient un segment /images/ pour séparer le nom de fichier ;
    fs.unlink(`images/${filename}`, () => { // Nous utilisons ensuite la fonction unlink du package fs pour supprimer ce fichier, en lui passant le fichier à supprimer et le callback à exécuter une fois ce fichier supprimé ;
      Post.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Post supprimé !'}))
        .catch(error => res.status(400).json({ error }));
    });
  });
};

exports.getLikes = (req, res, next) =>  {
  Post.findOne({ _id: req.params.id })
  .then(post => {
      // Like for the first time
      if (!post.usersLiked.includes(req.body.userId) && req.body.like === 1) { // includes() method : check if something is in an array
          post.likes += 1;
          post.usersLiked.push(req.body.userId);
      // Cancel like
      } else if (post.usersLiked.includes(req.body.userId) && req.body.like === 0) {
          post.likes -= 1;
          let userKey = post.usersLiked.indexOf(req.body.userId)
          post.usersLiked.splice(userKey, 1);
      // Dislike for the first time
      } else if (!post.usersDisliked.includes(req.body.userId) && req.body.like === -1) {
          post.dislikes += 1;
          post.usersDisliked.push(req.body.userId);
      // Cancel dislike
      } else if (post.usersDisliked.includes(req.body.userId) && req.body.like === 0) {
          post.dislikes -= 1 ;
          let userKey = post.usersDisliked.indexOf(req.body.userId) // We are getting the index of the element we are currently on.
          post.usersDisliked.splice(userKey, 1); // spilce() method change an array content by delete or add elements. Here we are deleting the first element start from "userKey"
      }
      Post.updateOne({ _id: req.params.id }, { likes: post.likes, usersLiked: post.usersLiked, dislikes: post.dislikes, usersDisliked: post.usersDisliked })
      // Post.updateOne({ _id: req.params.id }, { dislikes: post.dislikes, usersDisliked: post.usersDisliked }) // UpdateOne takes 3 parameters : filter, document, options
      .then(() => res.status(200).json({ message: 'Post updated successfully!'}))
      .catch(error => res.status(400).json({ error: error }));
  })
  .catch(error =>res.status(500).json({ error : error }))
};