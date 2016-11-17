var express = require('express');
var router = express.Router();

var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var DB_CONN_STR = 'mongodb://127.0.0.1:27017/Short-Url-DB';

var list = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
var len = list.length;
/* GET home page. */
//router.get('/', function (req, res, next) {
//	res.render('index', {
//		title: 'Express'
//	});
//});
router.get('/*', function (req, res, next) {

	var shortUrl = req.originalUrl.replace('/', '');
	console.log(shortUrl);
	var urlId;

	var decode = function (str, callback) {
		var num = 0;
		while (str.startsWith('a')) {
			str = str.substring(1,str.length);
		}
		for (var i = 0; i < str.length; i++) {
			num = num * len + list.indexOf(str.charAt(i));
		}
		callback(num);
	};

	var checkid = function (db, callback) {
			var collection = db.collection('ids');
			var way = {
				"id": urlId
			};
			collection.find(way).toArray(function (err, result) {
				if (err) {
					console.log('Error:' + err);
					return;
				}
				callback(result);
			});
		}
	//Change to id
	decode(shortUrl, function (decodeResult) {
		urlId = decodeResult;
		console.log("real Url:" + urlId);


		MongoClient.connect(DB_CONN_STR, function (err, db) {
			console.log("Connected");
			checkid(db, function (checkResult) {
				if (checkResult != null && checkResult.length != 0) {
					var realUrl = checkResult[0].lUrl;
					//if exists, send back the shortUrl
					console.log("real Url:" + realUrl);
					res.redirect('http://'+ realUrl.replace('http://','').replace('https://',''));
				} else {
					var err = new Error('Not Found');
					err.status = 404;
					next(err);
				}

			});
		});

	});

});

router.post("/shorten", function (req, res) {
	var longUrl = req.body.longUrl.replace('http://','').replace('https://','');

	//check if the long url exists
	var checkLongUrl = function (db, callback) {
		var collection = db.collection('ids');
		var way = {
			"lUrl": longUrl
		};
		collection.find(way).toArray(function (err, result) {
			if (err) {
				console.log('Error:' + err);
				return;
			}
			callback(result);
		});
	}

	var selectLastId = function (db, callback) {
		var collection = db.collection('ids');
		collection.find().sort({
			id: -1
		}).toArray(function (err, result) {
			if (err) {
				console.log('Error:' + err);
				return;
			}
			callback(result);
		});
	}


	var encode = function (num, callback) {
		var str = '';
		while (num > 0) {
			str = list.charAt(num % len) + str;
			num = Math.floor(num / len);
		}
		while (str.length < 5){
			str = 'a' + str;
		}
		callback(str);
	};



	MongoClient.connect(DB_CONN_STR, function (err, db) {
		console.log("Connected");
		checkLongUrl(db, function (checkResult) {
			if (checkResult != null && checkResult.length != 0) {
				//if exists, send back the shortUrl
				console.log("LongUrl Exists:" + checkResult[0].sUrl);
				res.send("127.0.0.1:3000/" + checkResult[0].sUrl);
			} else {
				var newId;
				//find the last id and increase 1
				selectLastId(db, function (selectResult) {
					if (selectResult != null && selectResult.length != 0) {
						console.log("last id:" + selectResult[0].id);
						newId = selectResult[0].id + 1;
					} else {
						newId = 1000;
					}
					console.log("new ID:" + newId);
					var shortUrl = null;
					//Change to short Url
					encode(newId, function (encodeResult) {
						shortUrl = encodeResult;
						console.log("short Url:" + shortUrl);

						//save id longUrl shortUrl to db
						//						insert data
						var insertData = function (db, callback) {
							var collection = db.collection('ids');
							var data = {
								"id": newId,
								"sUrl": shortUrl,
								"lUrl": longUrl
							};
							collection.save(data, function (err, result) {
								if (err) {
									console.log('Error:' + err);
									return;
								}
								callback(result);
							});
						}

						insertData(db, function (insertRes) {
							console.log("Insert Result:" + insertRes);
							db.close();
						});
						//send sUrl back to client
						res.send("127.0.0.1:3000/" + shortUrl);
					});
				});
			}
		});
	});
});


module.exports = router;