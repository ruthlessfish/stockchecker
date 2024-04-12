"use strict";
const crypto = require("crypto");
const Like = require("../models/like");

const STOCK_DATA_API =
  "https://stock-price-checker-proxy.freecodecamp.rocks/v1/";

function anonymizeIp(ip) {
  const hash = crypto.createHash("sha256");
  hash.update(ip);
  return hash.digest("hex");
}

async function saveLike(stock, ip) {
  const isLiked = await Like.findOne({ stock: stock, ip: ip });

  if (!isLiked) {
    const likeData = new Like({ stock: stock, ip: ip });
    await likeData.save();
  }
}

async function getLikes(stock) {
  return await Like.countDocuments({ stock: stock });
}

async function getStockData(stock, like, ip) {
  stock = stock.toUpperCase();
  const response = await fetch(`${STOCK_DATA_API}stock/${stock}/quote`);
  const data = await response.json();
  if (like === "true") {
    await saveLike(data.stock, ip);
  }

  return {
    stock: data.stock,
    price: data.latestPrice,
    likes: await getLikes(data.stock),
  };
}

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const resultJSON = {};
    const stockSymbol = req.query.stock;
    const like = req.query.like;
    const ip = anonymizeIp(req.ip);

    if (Array.isArray(stockSymbol)) {
      resultJSON.stockData = stockSymbol.map(
        async (stock) => await getStockData(stock, like, ip)
      );
      const aLikes = resultJSON.stockData[0].likes;
      const bLikes = resultJSON.stockData[1].likes;
      resultJSON.stockData[0].rel_likes =
        (aLikes - bLikes) / Math.abs(aLikes - bLikes);
      resultJSON.stockData[1].rel_likes =
        (bLikes - aLikes) / Math.abs(aLikes - bLikes);
      resultJSON.stockData[0].likes = undefined;
      resultJSON.stockData[1].likes = undefined;
    } else {
      resultJSON.stockData = await getStockData(stockSymbol, like, ip);
    }

    res.json(resultJSON);
  });
};
