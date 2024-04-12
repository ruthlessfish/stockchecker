const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  test("GET /api/stock-prices - should return stock data for a single stock", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: "AAPL" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.property(res.body, "stockData");
        assert.propertyVal(res.body.stockData, "stock", "AAPL");
        assert.property(res.body.stockData, "price");
        assert.propertyVal(res.body.stockData, "likes", 0);
        done();
      });
  });

  test("GET /api/stock-prices - should view one stock and like it", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: "AAPL", like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.property(res.body, "stockData");
        assert.propertyVal(res.body.stockData, "stock", "AAPL");
        assert.property(res.body.stockData, "price");
        assert.propertyVal(res.body.stockData, "likes", 1);
        done();
      });
  });

  test("GET /api/stock-prices - should view one stock and attempt to like it again", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: "AAPL", like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.property(res.body, "stockData");
        assert.propertyVal(res.body.stockData, "stock", "AAPL");
        assert.property(res.body.stockData, "price");
        assert.propertyVal(res.body.stockData, "likes", 1);
        done();
      });
  });

  test("GET /api/stock-prices - should return stock data for multiple stocks", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: ["AAPL", "GOOGL"] })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.property(res.body, "stockData");
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.propertyVal(res.body.stockData[0], "stock", "AAPL");
        assert.property(res.body.stockData[0], "price");
        assert.property(res.body.stockData[0], "rel_likes");
        assert.propertyVal(res.body.stockData[1], "stock", "GOOGL");
        assert.property(res.body.stockData[1], "price");
        assert.property(res.body.stockData[1], "rel_likes");
        done();
      });
  });

  test("GET /api/stock-prices - should view two stocks and like them", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: ["AAPL", "GOOGL"], like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.property(res.body, "stockData");
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.propertyVal(res.body.stockData[0], "stock", "AAPL");
        assert.property(res.body.stockData[0], "price");
        assert.property(res.body.stockData[0], "rel_likes");
        assert.propertyVal(res.body.stockData[1], "stock", "GOOGL");
        assert.property(res.body.stockData[1], "price");
        assert.property(res.body.stockData[1], "rel_likes");
        done();
      });
  });
});
