module.exports = (function ()
{
    // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Math/math.random
    var getRandomInt = function getRandomInt(min, max)
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    var getRandomBool = function getRandomBool()
    {
        return Math.random() < 0.5;
    };

    var generateRandomStockQuotes = function generateRandomStockQuotes(stocks)
    {
        var upOrDown, amount;

        for (var i = 0; i < stocks.length; i++)
        {
            upOrDown = getRandomBool();
            amount = getRandomInt(5, 100) / 100;

            stocks[i].quote = upOrDown ? stocks[i].quote + amount : stocks[i].quote - amount;
            stocks[i].quote = Math.round(stocks[i].quote * 100) / 100;
        }

        return stocks;
    };

    return {
        getInt: getRandomInt,
        getBool: getRandomBool,
        getStockQuotes: generateRandomStockQuotes
    }

})();