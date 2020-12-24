const models = require('../models');
const Portfolio = models.Portfolio;

var exports = module.exports = {}

exports.list = (req, res, next) => {

    const user = req.session.passport.user;

    Portfolio.findAll({
        where: {userId: user},
        raw: true
    })
    .then(rows => {

        // render view
        res.render('portfolios', {
            title: 'Портфели',
            user: req.session.passport.user,
            data: rows
        });

    })
    .catch((err) => {
        console.log('Error reading portfolios: ', err)
    });
}

exports.action = (req, res, next) => {
    
    switch (req.body.action) {

        case 'new':
            res.redirect('/portfolio/new');
            break;

        case 'add':

            // Add new portfolio

            let comission = (req.body.comission === '') ? 0 : req.body.comission;

            Portfolio.create({
                title: req.body.title,
                currency: req.body.currency,
                comission: comission,
                memo: req.body.memo,
                dateopen: req.body.dateopen,
                userId: req.session.passport.user
            })
            .then(newPortfolio => console.log(`Portfolio ${NewPortfolio.title} is successfully created.`))
            .catch(err => console.log('Error while creating portfolio: ', err));


            res.redirect('portfolio');
            break;

        case 'delete':

            if (req.body.id != '') {
                Portfolio.destroy({
                    where: {
                        id: parseInt(req.body.id)
                    }
                })
                .then(rowDeleted => {
                        if (rowDeleted > 0) {
                            console.log(`Portfolio ${req.body.title} deleted successfully.`);
                        }
                })
                .catch(err => console.log('Error deleting portfolio:', err));

            }

            res.redirect('portfolio');
            break;

        case 'save':

            Portfolio.update({
                title: req.body.title,
                currency: req.body.currency,
                comission: (req.body.comission === '') ? 0 : req.body.comission,
                memo: req.body.memo,
                dateopen: req.body.dateopen,
                userId: req.session.passport.user
            }, {
                where: {
                    id: parseInt(req.body.id)
                }
            })
            .then((rowsUpdated) => {
                console.log(`${rowsUpdated} rows updated in Portfolio`);
            })
            .catch(err => {
                console.log('Error updating Portfolio table: ', err);
            });

            res.redirect('portfolio');
            break;

        case 'edit':
            res.redirect(`/portfolio/edit/${req.body.id}`);
            break;

        default:
            res.redirect('/portfolio');
    }
}

exports.new = (req, res, next) => {
    res.render('portfolio-new', {
        title: 'Новый портфель',
        user: req.session.passport.user,
        data: req.body
    });
}

exports.edit = (req, res, next) => {

    Portfolio.findOne({
        where: {
            id: req.params.id
        }
    })
    .then(rows => {

        // render view
        res.render('portfolio-edit', {
            title: 'Параметры портфеля',
            user: req.session.passport.user,
            data: rows
        });

    })
    .catch((err) => {
        console.log('Error reading portfolios: ', err)
    });

}