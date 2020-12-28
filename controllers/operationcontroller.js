const models = require('../models');
const Operation = models.Operation;

exports.list = (req, res, next) => {

    Operation.findAll({
        raw: true
    })
    .then(rows => {
        res.render('operations/index', {
            title: 'Операции',
            data: rows
        });
    })
    .catch((err) => {
        console.log('Error reading operations: ', err)
    })
}

exports.action = (req, res, next) => {
    
    switch (req.body.action) {

        case 'new':
            res.redirect('/operations/new');
            break;

        case 'add':

            // Add new operation

            Operation.create({
                title: req.body.title,
            })
            .then(newOperation => console.log(`Operation ${newOperation.title} is successfully created.`))
            .catch(err => console.log('Error while creating operation: ', err));


            res.redirect('operations');
            break;

        case 'delete':

            if (req.body.id != '') {
                Operation.destroy({
                    where: {
                        id: parseInt(req.body.id)
                    }
                })
                .then(rowDeleted => {
                        if (rowDeleted > 0) {
                            console.log(`Operation ${req.body.title} deleted successfully.`);
                        }
                })
                .catch(err => console.log('Error deleting operation:', err));

            }

            res.redirect('operations');
            break;

        case 'save':

            Operation.update({
                title: req.body.title,
            }, {
                where: {
                    id: parseInt(req.body.id)
                }
            })
            .then((rowsUpdated) => {
                console.log(`${rowsUpdated} rows updated in Operation`);
            })
            .catch(err => {
                console.log('Error updating Operation table: ', err);
            });

            res.redirect('operations');
            break;

        case 'edit':
            res.redirect(`/operations/edit/${req.body.id}`);
            break;

        default:
            res.redirect('/operations');
    }
}

exports.new = (req, res, next) => {
    res.render('operations/new', {
        title: 'Создать операцию',
        data: req.body
    });
}

exports.edit = (req, res, next) => {

    Operation.findOne({
        where: {
            id: req.params.id
        }
    })
    .then(rows => {

        // render view
        res.render('operations/edit', {
            title: 'Изменить операцию',
            data: rows
        });

    })
    .catch((err) => {
        console.log('Error reading operation: ', err)
    });

}