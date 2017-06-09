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
					value: `${val.protocol}${val.username}:${val.password}@${val.url}`
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
      console.log(couchUrl);
      unirest.get( answers.dbconn + '/_all_dbs' )
        .end( function onGroupDbsUrlGet(response) {
          
          var dbs = JSON.parse(response.body)
          console.log(JSON.stringify(dbs))
          dbs.forEach(function(db) {
            if (db.indexOf('group-') !== -1) {
              //groupDbs.push(db)
            }
          })
          var str = 'group-kenya_primr_dfid_2013,group-kisumu_mini_egra_2013,group-primrictkisumu2013,group-kenya_primr_usaid_endline_2013,group-kenya_primr_dfid_midterm_2013,group-kenya_kisumu_endline_2013,group-kenya_equating_2013_2,group-kenya_primr_lcps_nov2013,group-rtilcpsnov2013,group-kenya_primr_tablet_program,group-tutor,group-tutor_feb_25,group-dfid_equating_2014,group-dfid_equating__may_2014,group-dfid_miniegra_2014,group-induction_2014,group-dfid_miniegra_july_2014,group-dfid_endline_2014,group-endline_pilot_sep_14,group-dfid_endline_supervisor_2014,group-kenya_primr_dfid_endline_2014,group-kenya_primr_dfid_endline_supervisor_2014,group-low_cost_private_schools_2014,group-tayari_ecd_materials_assessment_2014,group-tayari_baseline_assessment_pilot,group-lcps_mapping_feb_2015,group-lcps_mapping_test,group-lcps_mapping_moest_2015,group-tayari_apbet_mapping,group-tusome_apbet_mapping_march_2015,group-pilot_nairobi,group-nairobi_pilot,group-pilot_laikipia,group-tusome_apbeti_validation_april15,group-moest_training_apr15,group-health_scoping_exercise,group-tayari_health_analysis_exercise_june15,group-tayari_health_scoping_exercise_june15,group-tac_tutor_training_monitoring_sep_15,group-kicd_needs,group-needs_assessment_sne_2015,group-kicd_needs_assessment_sep15,group-tusome_capacity_assessment_study,group-datamaterials_validation_,group-tusome_capacity_assessment_final,group-tayari_longitudinal_study,group-tayari_longitudinal_supervisor_training,group-tayari_longitudinal_supervisor_jan16,group-tayari_longitudinal_jan16,group-kicd_needs_assessment_jan16,group-tayari_parents_survey_training,group-tayari_parents_consent_feb16,group-tusome_tablet_study_aprmay16,group-tusome_mini_egra_training,group-tusome_mini_egra_jul16,group-tayari_longitudinal_midterm_supervisor_training,group-tayari_longitudinal_midterm_training,group-tayari_longitudinal_midterm_assessors_training,group-tusome_evaluation_feb17,group-tusome_evaluation_pilot_jan17,group-tusomeevaluation_feb17_share,group-tusome_test_retest_mar17,group-child_health_assessment_2017,group-tayari_child_health_assessment_apr17'
          groupDbs = str.split(',');
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
            //console.log(`${couchUrl}/${db}/_all_docs`);
            unirest.get( `${couchUrl}/${db}/_all_docs` )
                .end(function (response) {
                var obj = JSON.parse(response.body) 
                console.log(db + " and #docs: " + JSON.stringify(obj.total_rows)) ; 

                var waitTill = new Date(new Date().getTime() + 800);
                while(waitTill > new Date()){}       

                metadata[db] = new Array(obj.total_rows)
                resolve()
                 } )
          })
          return metadata
  } ) 
})

}

var meta  = function () {
    console.log("META" + JSON.stringify(metadata))
}
init();




