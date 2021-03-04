const models = require('../../models');
const Goal = models.Goal;

var exports = module.exports = {};

exports.list = (req, res, next) => {

        const portfolioId = req.params.id;
        if (!portfolioId) {
            return res.status(400).json({
                error: 'Portfolio is not selected'
            });
        };

        Goal.findAll({
            attributes: [
                'id',
                'secid',
                'amount'
            ],
            where: {
                'portfolioId': portfolioId
            },
            order: [
                ['secid', 'ASC']
            ],
            raw: true
        })
        .then(goals => {
            res.json({
                goals: goals
            });
        })
        .catch(err => {
            return res.status(500).json({
                error: err
            });
        });

}

exports.save = (req, res, next) => {

        const portfolioId = req.params.id;
        if (!portfolioId) {
            return res.status(400).json({
                error: 'Portfolio is not selected'
            });
        };

        if (req.body.length > 0) {

            Goal.destroy({
                where: {portfolioId : portfolioId},
                truncate: true
            })
            .then(rowDeleted => {
                console.log(`${rowDeleted} rows deleted successfully`);

                // create new records              
                let promises = [];
                               
                req.body.forEach(row => {
                    let func = Goal.create({
                        portfolioId: parseInt(portfolioId),
                        secid: row.secid,
                        amount: row.amount
                    });
                    promises.push(func);
                });
          
                return Promise.all(promises);

            })
            .then(result => {
                
                return res.json({
                    success: 'Goals saved'
                });

            })
            .catch(err => {
                console.log(err);
                next(err);
            });
        }

}