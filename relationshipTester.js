const models = require('./models');
const User = models.User;
const Favorite = models.Favorite;

Favorite.findAll({
    where: {userId: 1}, include: 'user'
})
.then((findedFavorite) => {
    console.log(findedFavorite);
})
.catch((err) => {
    console.log('Error while getting favorites: ', err);
})
