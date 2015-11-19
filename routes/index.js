var express = require('express');
var router = express.Router();
var ExchangeA = require('../lib/ExchangeA');
var ExchangeB = require('../lib/ExchangeB');

/* GET home page. */
router.get('/', function (req, res, next)
{
    var exchangesStocksMapping = {};
    exchangesStocksMapping[ExchangeA.name] = ExchangeA.stocks;
    exchangesStocksMapping[ExchangeB.name] = ExchangeB.stocks;

    res.render('index', {
        title: 'EDA - Assignment 2 - Exercise 3',
        exchangesStocksMapping: exchangesStocksMapping
    });
});

module.exports = router;
