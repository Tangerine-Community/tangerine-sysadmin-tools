"use strict"

var _ 				= require('lodash');
var chalk 			= require('chalk');
var cradle 			= require('cradle');
var inquirer 		= require('inquirer');
var jsonfile 		= require('jsonfile');
let HttpStatus = require('http-status-codes');

let fs = require('fs')
let unirest = require('unirest');

//** Task Modules **//
var docRestore		= require('./docRestore/restore')
var groupDbs = []
let Conf = require('./config.json');

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
     meta ();
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
      console.log('Getting all Group databases.')
      couchUrl = answers.dbconn
      unirest.get( answers.dbconn + '/_all_dbs' )
        .end( function onGroupDbsUrlGet(response) {
          
          var dbs = JSON.parse(response.body)
          console.log(JSON.stringify(dbs))
          dbs.forEach(function(db) {
            if (db.indexOf('group-') !== -1) {
              groupDbs.push(db)
            }
          })
          resolve()
        })
    }) })
  })
  .then(function getDocumentsTotal(resolve, reject) {
    return new Promise(function getAllDocumentsTotals(resolve, reject) {
      console.log(chalk.yellow(
		'--------------------------------\n'+
		'Getting document counts.\n'+
		'--------------------------------'
	));
        groupDbs.forEach(function (db) {
            unirest.get( `${couchUrl}/${db}/_all_docs` )
                .end(function (response) {
                var obj = JSON.parse(response.body) 
                console.log(db + " and #docs: " + JSON.stringify(obj.total_rows))            
                metadata[db] = new Array(obj.total_rows)
                resolve()
                 } )
          })
          return metadata
  } ) 
})
.then(function getAccountMetadata(resolve, reject) {
    return new Promise(function getAccount(resolve, reject) {
      console.log(chalk.yellow(
		'--------------------------------\n'+
		'Getting account metadata.\n'+
		'--------------------------------'
	));
    groupDbs.forEach(function (db) {
        unirest.get( `${couchUrl}/${db}/account_metadata` )
            .end(function (response) {
                var obj = JSON.parse(response.body) 
                console.log(db + " and #chargecode: " + JSON.stringify(obj.chargeCode))
                metadata[db] = new Array(obj.chargeCode)
                //resolve()
    //console.log("META" + JSON.stringify(metadata))

    
             })
    })
    //meta();

    return metadata
  } ) 
    
})
}

var meta  = function () {
    console.log("META" + JSON.stringify(metadata))
}
init();




