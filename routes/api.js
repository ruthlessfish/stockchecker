"use strict";

const crypto = require("crypto");
const Like = require("../models/like");

/**
 * The URL for the stock data API.
 * @constant {string}
 */
const STOCK_DATA_API = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/";

/**
 * Anonymizes the given IP address using SHA256 hashing algorithm.
 * @param {string} ip - The IP address to anonymize.
 * @returns {string} The anonymized IP address.
 */
function anonymizeIp(ip) {
  const hash = crypto.createHash("sha256");
  hash.update(ip);
  return hash.digest("hex");
}

/**
 * Saves a like for the given stock and IP address.
 * @param {string} stock - The stock symbol.
 * @param {string} ip - The IP address of the user.
 * @returns {Promise<void>} A promise that resolves when the like is saved.
 */
async function saveLike(stock, ip) {
  const isLiked = await Like.findOne({ stock: stock, ip: ip });

  if (!isLiked) {
    const likeData = new Like({ stock: stock, ip: ip });
    await likeData.save();
  }
}

/**
 * Gets the number of likes for the given stock.
 * @param {string} stock - The stock symbol.
 * @returns {Promise<number>} A promise that resolves with the number of likes.
 */
async function getLikes(stock) {
  return await Like.countDocuments({ stock: stock });
}

/**
 * Gets the stock data for the given stock symbol.
 * @param {string} stock - The stock symbol.
 * @param {string} like - A string indicating whether the user liked the stock.
 * @param {string} ip - The IP address of the user.
 * @returns {Promise<Object>} A promise that resolves with the stock data.
 * @throws {Error} If there is an error fetching the stock data.
 */
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

/**
 * Initializes the API routes.
 * @param {Object} app - The Express app object.
 */
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
