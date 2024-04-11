'use strict';

module.exports = function (app) {
  const STOCK_DATA_API = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/";

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const stockData = {};
      const stockSymbol = req.query.stock;
      const like = req.query.like;
      const ip = req.ip;
      
      if (Array.isArray(stockSymbol)) {
        stockData.stockData = [];
        stockSymbol.forEach((stock, index) => {
          stockData.stockData.push({ stock: stock, price: 0, likes: 0 });
        });
        for (let stock of stockData.stockData) {
          const stockUrl = `${STOCK_DATA_API}stock/${stock.stock}/quote`;
          const response = await fetch(stockUrl);
          const data = await response.json();
          stock.price = data.latestPrice;
          // write like data to mongo database here
        }
      } else {
        const stockUrl = `${STOCK_DATA_API}stock/${stockSymbol}/quote`;
        const response = await fetch(stockUrl);
        const data = await response.json();
        stockData.stock = stockSymbol;
        stockData.price = data.latestPrice;
        stockData.likes = 0;
        // write like data to mongo database here
      }

      res.json(stockData);
    });
    
};
