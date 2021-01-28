const models = require('../models');
const User = models.User;

var exports = module.exports = {}

exports.profile = (req, res, next) => {

    var user = 0;
    if (req.isAuthenticated()) {
        id = req.session.passport.user;
    } else {
        res.redirect('/signin');
    }

    User.findOne({
        where: {id: id},
        raw: true
    })
    .then(user => {

        res.render('users/profile', {
            user: user,
            message: req.flash('message')
        });

    })
    .catch(err => {
        console.log(err);
        next(err);
    })

    

}