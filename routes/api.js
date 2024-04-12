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
  try {
    stock = stock.toUpperCase();
    const response = await fetch(`${STOCK_DATA_API}stock/${stock}/quote`);
    if (!response.ok) {
      throw new Error("Failed to fetch stock data");
    }
    const data = await response.json();
    if (like === "true") {
      await saveLike(data.stock, ip);
    }
    return {
      stock: data.stock,
      price: data.latestPrice,
      likes: await getLikes(data.stock),
    };
  } catch (error) {
    // Handle the error here
    console.error(error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const resultJSON = {};
    const stockSymbol = req.query.stock;
    const like = req.query.like;
    const ip = anonymizeIp(req.ip);

    if (Array.isArray(stockSymbol)) {
      const stockData = await Promise.all(
        stockSymbol.map(async (stock) => await getStockData(stock, like, ip))
      );
      const aLikes = stockData[0].likes;
      const bLikes = stockData[1].likes;
      stockData[0].rel_likes = (aLikes - bLikes) / Math.abs(aLikes - bLikes);
      stockData[1].rel_likes = (bLikes - aLikes) / Math.abs(aLikes - bLikes);
      stockData[0].likes = undefined;
      stockData[1].likes = undefined;
      resultJSON.stockData = stockData;
    } else {
      resultJSON.stockData = await getStockData(stockSymbol, like, ip);
    }

    res.json(resultJSON);
  });
};
