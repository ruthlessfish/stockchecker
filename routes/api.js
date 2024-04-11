'use strict';
const cryupto = require('crypto');
const Like = require('../models/like');

function anonymizeIp(ip) {
  const hash = cryupto.createHash('sha256');
  hash.update(ip);
  return hash.digest('hex');
}

module.exports = function (app) {
  const STOCK_DATA_API = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/";

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      console.log('GET /api/stock-prices');
      console.log(req.query);
      const resultJSON = {};
      let stockSymbol = req.query.stock;
      const like = req.query.like;
      const ip = anonymizeIp(req.ip);
      
      if (Array.isArray(stockSymbol)) {
        console.log('Array.isArray(stockSymbol)');
        resultJSON.stockData = [];

        stockSymbol.forEach((stock) => {
          stock = stock.toUpperCase();
          resultJSON.stockData.push({ stock: stock, price: 0, rel_likes: 0 });
        });
        console.log(resultJSON);

        for (let stock of resultJSON.stockData) {
          console.log('getting  stock price for ' + stock.stock);
          const stockUrl = `${STOCK_DATA_API}stock/${stock.stock}/quote`;
          const response = await fetch(stockUrl);
          const data = await response.json();
          console.log(data);
          stock.price = data.latestPrice;

          if (like === 'true') {
            const isLiked = await Like.findOne({ stock: stock.stock, ip: ip });
            if (!isLiked) {
              console.log('saving like');
              const likeData = new Like({ stock: stock.stock, ip: ip });
              await likeData.save();
            }
          }

          stock.likes = await Like.countDocuments({ stock: stock.stock });
        }

        const aLikes = resultJSON.stockData[0].likes;
        const bLikes = resultJSON.stockData[1].likes;

        resultJSON.stockData[0].rel_likes = (aLikes - bLikes) / Math.abs(aLikes - bLikes);
        resultJSON.stockData[1].rel_likes = (bLikes - aLikes) / Math.abs(aLikes - bLikes);

        resultJSON.stockData[0].likes = undefined;
        resultJSON.stockData[1].likes = undefined;
      } else {
        console.log('!Array.isArray(stockSymbol)');
        resultJSON.stockData = {}
        stockSymbol = stockSymbol.toUpperCase();
        const stockUrl = `${STOCK_DATA_API}stock/${stockSymbol}/quote`;
        const response = await fetch(stockUrl);
        const data = await response.json();

        resultJSON.stockData.stock = stockSymbol;
        resultJSON.stockData.price = data.latestPrice;
        resultJSON.stockData.likes = 0;

        console.log(resultJSON);

        if (like === 'true') {
          const isLiked = await Like.findOne({ stock: stockSymbol, ip: ip });

          if (!isLiked) {
            const likeData = new Like({ stock: stockSymbol, ip: ip });
            await likeData.save();
          }
        }

        resultJSON.stockData.likes = await Like.countDocuments({
          stock: stockSymbol,
        });
      }

      console.log(resultJSON);

      res.json(resultJSON);
    });
    
};
