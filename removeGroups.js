"use strict"

var _ 				= require('lodash');
var chalk 			= require('chalk');
var cradle 			= require('cradle');
var inquirer 		= require('inquirer');
var jsonfile 		= require('jsonfile');
let HttpStatus = require('http-status-codes');

let fs = require('fs')
let unirest = require('unirest');

const JSON_OPTS = {
  'Content-Type' : 'application/json',
  'Accept'       : 'application/json'
};

var docRestore		= require('./docRestore/restore')
var groupDbs = []
let Conf = require('./config.json');

var userDb
var couchUrl
var metadata = []
var questions;
var choices;

var config = {
	file: './config.json',
	data: null
};

var init = function(){

	process.title = "Tangerine: Sysadmin Tools";

	console.log(chalk.yellow(
		'--------------------------------\n'+
		'Tangerine: Sysadmin Tools\n'+
		'--------------------------------'
	));

	console.log(chalk.blue('Loading Configuration ('+ config.file +')...'));

	jsonfile.readFile(config.file, function(err, obj) {
	  if(err){
	  	console.log(chalk.red('There was an error loading your configuration file. Ensure that your config.json is setup correctly and try again.'));
	  	return;
	  }
	  config.data = obj;
	 setupQuestions();
     //beginQuestions();
     upgrade();
	});
};

var setupQuestions = function(){
	questions = [{
		type: 'list',
		message: 'Which database server would you like to connect to?',
		name: 'dbconn',
		choices: function(){
			choices = [];
			_.forIn(config.data, function(val, key){ 
				choices.push({
					name: key,
					value: `${val.protocol}${val.username}:${val.password}@${val.url}/db`
				}); 
			});
			return choices;
		},
		default: 0
	}
    ]}

var upgrade = function() {
  return (new Promise(function startUpgrade(resolve, reject) {
    console.log("Starting ...")
    resolve()
  }))
  .then(function getGroupDbs(resolve, reject) {
    return new Promise(function getGroupDbsPromise(resolve, reject) {
      inquirer.prompt( questions, function( answers ) {
        //console.log('Getting all Group databases.')
        couchUrl = answers.dbconn
        //console.log(JSON.stringify(dbs))
        var str = 'rti_tanzania_2013'
        groupDbs = str.split(',')
        resolve()
    }) })
  })
.then(function getUsers(resolve, reject) {
    return new Promise(function getAccount(resolve, reject) {
      console.log(chalk.yellow(
		'--------------------------------\n'+
		'Getting user info.\n'+
		'--------------------------------'
	));
    groupDbs.forEach(function(db) {
      console.log(couchUrl + '/_users/_all_docs')
      unirest.get(couchUrl + '/_users/_all_docs?include_docs=true') 
        .end (function onGetAllUsers(response) {
          
          if (response.status !== HttpStatus.OK ) return reject(response.body)
          //console.log(db)
          var users = JSON.parse(response.body)
          //console.log(users.roles)
          users.rows.forEach(function (user) {
            var roles = user.doc.roles
            if ( typeof roles !== 'undefined' ) 
              if ( roles.length !== 0 ) {   
                if (roles.indexOf("admin-" + db) !== -1 || roles.indexOf("member-" + db) !== -1) {
                  var iAdmin = roles.indexOf("admin-" + db);
                  var iMember = roles.indexOf("member-" + db);
                  if (iAdmin > -1) {roles.splice(iAdmin, 1); console.log("Removing admin-" + db + " for user:" + user.doc.name) }
                  if (iMember > -1) {roles.splice(iMember, 1); console.log("Removing member-" + db + " for user:" + user.doc.name) }
                  console.log('Saving new groups ' + user.doc.name) 
                  var userDoc = user.doc
                  userDoc.roles = roles
                  unirest.put(couchUrl + '/_users/org.couchdb.user:' + user.doc.name).headers(JSON_OPTS)
                    .json(userDoc)
                    .end(function onUpdateUserResponse(response) {
                      if (response.status > 199 && response.status < 399 ) resolve()
                      reject(response)
                    })

                }  
              }
          })

      }) 
      resolve()
      /*
      unirest.get(userDb + '/org.couchdb.user:' + userName)
          .end(function onGetUserResponse(response) {
            if (response.status !== HttpStatus.OK ) return reject(response.body)
            var userDoc = JSON.parse(response.body)
            if (userDoc.roles.indexOf("admin-" + db) !== -1 || userDoc.roles.indexOf("member-" + db) !== -1) {
              var iAdmin = userDoc.roles.indexOf(userDoc.roles.indexOf("admin-" + db));
              var iMember = userDoc.roles.indexOf(userDoc.roles.indexOf("member-" + db));
              if (iAdmin > -1) userDoc.roles.splice(iAdmin, 1);
              if (iMember > -1) userDoc.roles.splice(iMember, 1);
              console.log(JSON.stringify(userDoc));
            }  
            //unirest.get(userDb + '/org.couchdb.user:' + userName)
            //.end(function onGetUserResponse(response) {
            //  if (response.status !== HttpStatus.OK ) return reject(response.body)
            //  var userDoc = JSON.parse(response.body)
            //  console.log('Saving new groups ' + userName) 
              //unirest.put(userDb + '/org.couchdb.user:' + userName).headers(JSON_OPTS)
              //  .json(userDoc)
              //  .end(function onUpdateUserResponse(response) {
              //    if (response.status > 199 && response.status < 399 ) resolve()
              //    reject(response)
              //  })
            //})
          resolve()
        }) 
      })//foreach */
   })
  })
})

}

init();




