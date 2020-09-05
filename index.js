//Sabrina Meng, Neha Maddali Q4 Project May 19, 2020
/*Sources:
	W3Schools (general NodeJS and MongoDB information)
	Stack Overflow (for debugging)
	https://codeforgeek.com/manage-session-using-node-js-express-4/ (session information)
	https://developer.paypal.com/docs/archive/checkout/integrate/#1-get-the-code (PayPal Integration)
	https://www.npmjs.com/package/password-hash (Password Hash)
	https://www.ecommerce-nation.com/choose-best-payment-solution-e-commerce/ (general e-commerce info)
*/
//According to https://turbotax.intuit.com/tax-tips/self-employment-taxes/sales-tax-101-for-online-sellers/L4uTQCaIx, e-commerce sites do not normally charge sales tax unless they have a physical location. Thus, we have decided to not charge sales tax in our site

/*CREDENTIALS FOR TEST PAYPAL ACCOUNT:
	Email: sb-1lg3q1760876@personal.example.com
	Password: johndoe1
*/

//required dependencies
const http = require('http');
var express = require('express');
const session = require('express-session');
var app = express();
var path = require("path");
var router = express.Router();
var mongo = require("mongodb");

//Facilitates PayPal API Call
var request = require('request');

//hashes passwords
var passwordHash = require('password-hash');

//using session
app.use(session({secret: 'ssshhhhh'}));

// set the view engine to ejs
app.set('view engine', 'ejs');

//allows display of static files
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

//body parser parses the data sent
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended : true }));

//defining session variable
var sess;

var dbo;
//adding mongo client and creating database
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/Q4Proj";

//creating the database and inventory collection/inserting inventory data
MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	console.log("Database created!");
	dbo = db.db("Q4Proj");
	dbo.createCollection("inventory", function(err, res){
		if (err) throw err;
		console.log("Collection created!");
		var myobj = [
			{id: '1', item: 'Face Masks', qty: '5 Packs of 100', price: '40.00', img: 'masks.png', description: 'Top quality disposable face masks suitable for home, business, or medical use. Features stretchy ear loops. One size fits all.'},
			{id: '2', item: 'Hand Sanitizer', qty: 'Pack of 10', price: '20.00', img: 'sanitizer.jpg', description: '60% alcohol hand sanitizer leaves your hands clean and germ-free even when you do not have soap and water. Contains aloe, leaving your hands soft and moisturized.'},
			{id: '3', item: 'Nitrile Gloves', qty: '10 Packs of 100', price: '15.00', img: 'gloves.jpg', description: 'Latex-free nitrile gloves for home, business, and medical use. Disposable and one-size fits all.'},
			{id: '4', item: 'Sanitizing Wipes', qty: '10 Packs of 100', price: '40.00', img: 'wipes.jpg', description: 'Disposable sanitizing wipes kill 99.99% of cold and flu viruses on surfaces. Perfect for cleaning around the home or in professional settings.'},
			{id: '5', item: 'Disinfecting Spray', qty: '5 bottles', price: '15.00', img: 'spray.jpg', description: 'Multipurpose disinfecting spray for use on a wide variety of surfaces. Active ingredient kills 99.99% of cold and flu viruses.'},
			{id: '6', item: 'Rubbing Alcohol', qty: '10 bottles', price: '10.00', img: 'alcohol.jpg', description: '70% isopropyl alcohol disinfectant. Perfect for use in first aid kits.'},
			{id: '7', item: 'Thermometer', qty: 'Pack of 5', price: '5.00', img: 'thermometer.jpg', description: 'A high-quality and affordable digital thermometer to keep you and your family feeling healthier.'},
			{id: '8', item: 'Cough Drops', qty: '20 bags of 50', price: '17.00', img: 'drops.jpg', description: 'Soothing cough drops calm sore throats and reduce nasal congestion. Comes in a variety pack of cherry, honey, and mint flavors.'},
			{id: '9', item: 'Ibuprofen', qty: '5 bottles of 50', price: '20.00', img: 'ibu.jpg', description: 'Pain reliever and fever reducer. Perfect for use in home, business, and medical settings.'},
			{id: '10', item: 'Acetaminophen', qty: '5 bottles of 50', price: '20.00', img: 'ace.jpg', description: 'Pain reliever and fever reducer. Perfect for use in home, business, and medical settings.'},
		];
		//unique inputs, gives appropriate message if duplicate data is attempted to be inserted
		dbo.collection("inventory").createIndex( { "item": 1 }, { unique: true } );
		dbo.collection("inventory").insertMany(myobj, function(err, res) {
			if(err) {
				console.log("Duplicate entries cannot be made");
			}
			else {
				console.log("Number of documents inserted: " + res.insertedCount);
			}

		});
	});
});

//add the router
app.use('/', router);
app.listen(process.env.port || 3000);
console.log('Running at Port 3000');

//rendering pages
app.get('/',function(req,res){
  res.render('index.ejs');
});

app.get('/login',function(req,res){
  res.render('login.ejs');
});

app.get('/account',function(req,res){
  res.render('account.ejs');
});

app.get('/cart',function(req,res){
	//checking if user is logged in; if not, then cannot view cart
	sess = req.session;
	if(sess.user == undefined) {
		var message = "Please log in first before viewing your cart";
		res.render('message2.ejs', {message:message});
	}
	//otherwise, performs a query to get all products in user's cart, sends data to cart page
	else {
		user = sess.user;
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			dbo = db.db("Q4Proj");
			var query = {user:user};
			dbo.collection("orders").find(query).toArray(function(err, result) {
				if (err) throw err;
				var data = result;
				res.render('cart.ejs', {data:data, user:user});
			});
		});
	}
});

//alert the user to log in to view about me page if they have not already
app.get('/aboutme',function(req,res){
	sess = req.session;
	if(sess.user == undefined) {
		var message = "Please log in first before viewing your account information";
		res.render('message2.ejs', {message:message});
	}
	//otherwise, performs a query to get all the items that the user has ordered, sends results to aboutme page
	else {
		user = sess.user;
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			dbo = db.db("Q4Proj");
			var query = {user:user};
			dbo.collection("confirmed").find(query).toArray(function(err, result) {
				if (err) throw err;
				var num = result.length;
				var data = result;
			res.render('aboutme.ejs', {user:user, num:num, data:data});
			});
		});
	}
});

//logout of the account, destroys the current session
app.get('/logout',function(req,res){
	req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.render('logout.ejs');
    });
});

//queries the db for the inventory information to display on shop page
app.get('/shop',function(req,res){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		dbo = db.db("Q4Proj")
		dbo.collection("inventory").find().toArray(function(err, result) {
			if (err) throw err;
			var data = result;
			res.render('shop.ejs', {data:data, action:null});
		});
	});
});

//when a user clikcs create account, the database and collection will be created
app.post('/message',function(req,response){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		dbo = db.db("Q4Proj");
		var username = req.body.username;
		var pwd = req.body.pwd;
		var conf = req.body.conf;
		
		//queries db to see if a username already exists
		dbo.createCollection("users", function(err, res){
			if (err) throw err;
			console.log("Collection created!");
			var query = { username: username };

			dbo.collection("users").find(query).toArray(function(err, result) {
				if (err) throw err;
				var data = result;
				//checks if confirm password matches password
				if(pwd == conf) {
					//checks if the returned data length is 0 (thus meaning no identical usernames)
					if(data.length == 0) {
						var myobj = {username: username, pwd: passwordHash.generate(pwd)};
						
						//inserts user info into db
						dbo.collection("users").insertOne(myobj, function(err, res) {
							if (err) throw err;
							console.log("Number of documents inserted: " + res.insertedCount);
							var message = "Your account has been created successfully";
							response.render('message.ejs', {message:message});
						});
					}
					
					//if username is already taken, print this message
					else {
						var message = "The username has already been taken. Please try again.";
						response.render('message.ejs', {message:message});
					};
				}
				
				//if passwords do not match, print this message
				else {
					var message = "Your passwords do not match. Please try again.";
					response.render('message.ejs', {message:message});
				}
			});
		});
	});
});

app.post('/message2',function(req,response){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		dbo = db.db("Q4Proj");
		username = req.body.username;
		pwd = req.body.pwd;

		//queries db for the correct passwords associated with the user account
		var query = {username: username};
		dbo.collection("users").find(query).toArray(function(err, result) {
			if (err) throw err;
			var data = result;
			var correctPwd = data[0].pwd;

			//check if user-entered password matches correct password (use passwordHash.verify to compare hashed pwd with plaintext pwd)
			if(passwordHash.verify(pwd, correctPwd) == true) {
				var message = "Login successful!";
				sess = req.session;
				sess.user = req.body.username;
				response.render('message2.ejs', {message:message});
			}

			else {
				var message = "Login unsuccessful. Please try again.";
				response.render('message2.ejs', {message:message});
			}
		});
	});
});

app.post('/shop',function(req,response){
	//getting the information about which item/how many were added to cart
	var item = req.body.item;
	var qty = parseInt(req.body.quantity);
	var itemName = req.body.name;
	var unitPrice = parseFloat(req.body.unitPrice);
	sess = req.session;
	var user = sess.user;
	
	//ensure the user has logged into their account before adding items to cart
	if(sess.user == undefined) {
		var message = "Please log in first before adding items to cart";
		response.render('message2.ejs', {message:message});
	}
	else {
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			dbo = db.db("Q4Proj")
			dbo.createCollection("orders", function(err, res){
				if (err) throw err;
				var myobj = {user:user, item:item, qty:qty, itemName:itemName, unitPrice:unitPrice};
				
				//inserts item into orders collection (items that user has added to cart)
				dbo.collection("orders").insertOne(myobj, function(err, res) {
					if(err) throw err;
					console.log("Number of documents inserted: " + res.insertedCount);
				});
			});
			dbo.collection("inventory").find().toArray(function(err, result) {
				if (err) throw err;
				var data = result;
				var action = "Item successfully added to cart";
				response.render('shop.ejs', {data:data, action:action});
			});
		});
	}
});

app.post('/cart',function(req,response){
	//allows user to remove any items as they please
	sess = req.session;
	var user = sess.user;
	var remove;
	
	//if one item is to be removed, follow this code (pushes item into array)
	if (typeof req.body.check === "string") {
		var remove = [];
		remove.push(req.body.check);
	}
	
	//otherwise, items already in an array
	else {
		remove = req.body.check;
	}
	
	//remove an item from the cart and collection if the user does not want it
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		dbo = db.db("Q4Proj")
		for(var i=0; i<remove.length; i++) {
			var itemName = remove[i];
			dbo.collection("orders").deleteOne({user:user, itemName:itemName}, function(err, result) {
				if (err) throw err;
			});
		}
		
		//queries the db for updated cart information, sends for display
		var query = {user:user};
		dbo.collection("orders").find(query).toArray(function(err, result) {
			if (err) throw err;
			var data = result;
			response.render('cart.ejs', {data:data, user:user});
		});
	});
});

//details of the order are shown to customer
app.get('/details',function(req,res){
	sess = req.session;
	user = sess.user;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		dbo = db.db("Q4Proj");
		var query = {user:user};
		dbo.collection("orders").find(query).toArray(function(err, result) {
			if (err) throw err;
			var data = result;
			res.render('details.ejs', {data:data, user:user, message:null});
		});
	});
})

//renders the page to checkout the items in the cart
app.post('/checkout',function(req,res){
	sess = req.session;
	user = sess.user;
	
	//saves the total purchase amount as a session variable (used later during paypal payment)
	sess.total = req.body.total;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		dbo = db.db("Q4Proj");
		var query = {user:user};
		dbo.collection("orders").find(query).toArray(function(err, result) {
			if (err) throw err;
			var data = result;
			res.render('checkout.ejs', {data:data, user:user});
		});
	});
});

//select a payment method for the user when they checkout their items, final info for checkout
app.post('/confirm',function(req,response){
	sess = req.session;
	user = sess.user;
	console.log(sess.paid);
	var card = req.body.card;
	//checking whether payment is valid, then store the confirmed orders in the database
	if(card.length != 0 || req.body.payment == "PayPal"){
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			dbo = db.db("Q4Proj");
			var query = {user:user};
			dbo.collection("orders").find(query).toArray(function(err, result) {
				if (err) throw err;
				var data = result;
				dbo.createCollection("confirmed", function(err, res){
					if (err) throw err;
				});
				//generating confirmation number of the order
				var confNum = Math.floor(Math.random() * (89999)) + 10000;
				for(var i=0; i<data.length; i++){
					//getting info user entered for the order
					var insert = data[i];
					insert.name = req.body.name;
					insert.street = req.body.street;
					insert.city = req.body.city;
					insert.state = req.body.state;
					insert.zip = req.body.zip;
					insert.payment = req.body.payment;
					insert.card = passwordHash.generate(req.body.card);
					insert.confNum = confNum;
					dbo.collection("confirmed").insertOne(insert, function(err, res) {
						if (err) throw err;
					});
					dbo.collection("orders").deleteOne({user:user, itemName:data[i].itemName}, function(err, result) {
						if (err) throw err;
					});

				}
				//name, address, etc. for display on confirm page
				var name = req.body.name;
				var address = req.body.street + " " + req.body.city + ", " + req.body.state + " " + req.body.zip;
				var payment = req.body.payment;
				response.render('confirm.ejs', {data:data, user:user, name:name, address:address, payment:payment, confNum:confNum});
			});
		});
	}
	//if the payment is not completed, tell the user that they did not complete payment
	else {
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			dbo = db.db("Q4Proj");
			var query = {user:user};
			dbo.collection("orders").find(query).toArray(function(err, result) {
				if (err) throw err;
				var data = result;
				response.render('details.ejs', {data:data, user:user, message:"You did not pay. Please try again"});
			});
		});
	}
});

app.get('/covid',function(req, res){
	res.render('covid.ejs');
});

//code for PayPal
var CLIENT =
  'AWrydnkxbXqd6USAisgrHEU6emcAhHKICLmeAAcj05cNlqx5HCNey_qoqvFjjBkSCcCfIp7alrufrU2Q';
var SECRET =
  'EJUDANeuDf9ZYM_iDiAHxvj-BaAr3a712Do15mKVbp_891ULlMioDQ1bQIrVTsp3PKheb-UrGOFcmkal';
var PAYPAL_API = 'https://api.sandbox.paypal.com';
  // Set up the payment:
  // 1. Set up a URL to handle requests from the PayPal button
  app.post('/my-api/create-payment/', function(req, res)
  {
	  var total = sess.total;
    // 2. Call /v1/payments/payment to set up the payment
    request.post(PAYPAL_API + '/v1/payments/payment',
    {
      auth:
      {
        user: CLIENT,
        pass: SECRET
      },
      body:
      {
        intent: 'sale',
        payer:
        {
          payment_method: 'paypal'
        },
        transactions: [
        {
          amount:
          {
            total:  total,
            currency: 'USD'
          }
        }],
        redirect_urls:
        {
          return_url: 'https://example.com',
          cancel_url: 'https://example.com'
        }
      },
      json: true
    }, function(err, response)
    {
      if (err)
      {
        console.error(err);
        return res.sendStatus(500);
      }
      // 3. Return the payment ID to the client
      res.json(
      {
        id: response.body.id
      });
    });
  })
  // Execute the payment:
  // 1. Set up a URL to handle requests from the PayPal button.
  app.post('/my-api/execute-payment/', function(req, res)
  {
	  var total = sess.total;
    // 2. Get the payment ID and the payer ID from the request body.
    var paymentID = req.body.paymentID;
    var payerID = req.body.payerID;
    // 3. Call /v1/payments/payment/PAY-XXX/execute to finalize the payment.
    request.post(PAYPAL_API + '/v1/payments/payment/' + paymentID +
      '/execute',
      {
        auth:
        {
          user: CLIENT,
          pass: SECRET
        },
        body:
        {
          payer_id: payerID,
          transactions: [
          {
            amount:
            {
              total: total,
              currency: 'USD'
            }
          }]
        },
        json: true
      },
      function(err, response)
      {
        if (err)
        {
          console.error(err);
          return res.sendStatus(500);
        }
        // 4. Return a success response to the client
        res.json(
        {
          status: 'success'
        });
      });
  });
