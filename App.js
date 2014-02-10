Ext.define('CustomApp', {
	extend : 'Rally.app.App',
	componentCls : 'app',
	launch : function() {
		this._loadData();
	},

	_loadData : function() {
		var projects = Ext.create('Ext.util.HashMap');
		projects.add('13538110755', 'CGCS');
		projects.add('15267702952', 'VxWorks ST');
		projects.add('10479834443', 'IOT');
		projects.add('13420058203', 'IOT');
		projects.add('9740387440', 'Networking');
		projects.add('13245546162', 'Networking');
		projects.add('10957142069', 'OVP');
		projects.add('11470176273', 'Linux');
		projects.add('13744307332', 'VxWorks 653 3.0');
		projects.add('10253738811', 'VxWorks 7');
		projects.add('11490173498', 'VxWorks 7');
		projects.add('11424999507', 'VxWorks 7');
		projects.add('11490019566', 'VxWorks 7');
		projects.add('11424998698', 'VxWorks 7');
		projects.add('12890367855', 'VxWorks 7');
		projects.add('12405728916', 'Tools');
		projects.add('12868082229', 'Tools');
		projects.add('15106843053', 'Tools');
		projects.add('12168776634', 'Tools');

		var today = Rally.util.DateTime.toIsoString(new Date());

		var releaseDateFilter = Ext.create('Rally.data.wsapi.Filter', {
			property : 'ReleaseDate',
			operator : '>=',
			value : today
		});

		var releaseDatesFilter = releaseDateFilter.and(Ext.create(
				'Rally.data.wsapi.Filter', {
					property : 'ReleaseStartDate',
					operator : '<=',
					value : today
				}));

		var myStore = Ext.create('Rally.data.wsapi.Store',
				{
					model : 'Release',
					fetch : [ 'FormattedID', 'Name', 'ReleaseDate',
							'ReleaseStartDate' ],
					limit : Infinity,
					context : {
						project : '/project/11089755042',
						projectScopeDown : true
					},
					// Get all features
					filters : releaseDatesFilter,
					autoLoad : true,
					listeners : {
						load : function(myStore, myData, mySuccess) {

							var releases = Ext.create('Ext.util.HashMap');
							Ext.Array.each(myStore.getRecords(), function(release) {
								releases.add(release.get('_ref'), [release.get('ReleaseStartDate'), release.get('ReleaseDate')]);
							}
							);

							console.log(releases);
							var releaseFilter = Ext.create(
									'Rally.data.wsapi.Filter', {
										property : 'Release',
										value : "/release/11242254996"
									});


							console.log("Loaded release data: " + myStore.data.length);
							var myStore2 = Ext.create('Rally.data.wsapi.Store', {
								model : 'PortfolioItem/Feature',
								fetch : [ 'FormattedID', 'Name', 'Release', 'Project', 'State', 'c_PATracking', 'UserStories' ],
								limit : Infinity,
								context : {
									project : '/project/11089755042',
									projectScopeDown : true
								},

								autoLoad : true,
								listeners : {
									load : function(myStore, myData, mySuccess) {
										console.log("Loaded feature data: " + myStore.data.length);

										var total = Ext.create('Ext.util.HashMap');
										var reviewed = Ext.create('Ext.util.HashMap');
										var validated = Ext.create('Ext.util.HashMap');
										var hld = Ext.create('Ext.util.HashMap');
										var hldgreenlit = Ext.create('Ext.util.HashMap');
										
										Ext.Array.each(myStore.getRecords(), function(feature){
											var featureRelease = feature.get('Release');
											if (featureRelease != null) {
												var featureReleaseRef = featureRelease._ref;
												if (! releases.get(featureReleaseRef)) {
													myStore.remove(feature);
												}
												else {
													var featureProject = feature.get('Project');
													var featureProjectRef = featureProject._ref;
													var featureProjectRefID = featureProjectRef.split("/").pop(); 
													if (! projects.get(featureProjectRefID)) {
														myStore.remove(feature);
													}
													else {
														var projectName = projects.get(featureProjectRefID);
														console.log(projectName);
														if (! total.get(projectName)) {
															total.add(projectName, 1);
														}
														else {
															var totalTmp = total.get(projectName);
															totalTmp++;
															total.replace(projectName, totalTmp);
														}
														console.log(total.get(projectName));
														var featureTracking = feature.get('c_PATracking');
														// console.log(featureTracking);
														if (featureTracking == "Review") {
															if (! reviewed.get(projectName)) {
																reviewed.add(projectName, 1);
															}
															else {
																var reviewedTmp = reviewed.get(projectName);
																reviewedTmp++;
																reviewed.replace(projectName, reviewedTmp);
															}
														}
														console.log(reviewed.get(projectName));
														var featureState = feature.get('State');
														if (featureState != null) {
															featureStateName = featureState._refObjectName;
															// console.log(featureStateName);
															if (featureStateName == "Done") {
																if (! validated.get(projectName)) {
																	validated.add(projectName, 1);
																}
																else {
																	var validatedTmp = validated.get(projectName);
																	validatedTmp++;
																	validated.replace(projectName, validatedTmp);
																}
															}
															console.log(validated.get(projectName));
														}
														// GET USER STORIES - CHECK FOR HLD TAG, ETC.
													}
												}
											}
											else {
												myStore.remove(feature);
											}
										}
										);

										console.log(myStore.data.length);
										
										this._loadGrid(myStore,total,reviewed,validated);
									},
									scope : this
								}
							});
						},
						scope : this
					}
				});

	},

	_loadGrid : function(total, reviewed, validated, hld, hldgreenlit) {

		// Use Ext.grid.Panel instead of Rally grid

		// Do computation here, create new store from myStore data
		// https://help.rallydev.com/apps/2.0rc2/doc/#!/api/Ext.grid.Panel
		console.log("Total: ");
		console.log(total);
		console.log("Reviewed: ");
		console.log(reviewed);
		console.log("Validated: ");
		console.log(validated);

		var myGrid = Ext.create('Rally.ui.grid.Grid', {
			store : myStore,
			// columnCfgs : [ 'FormattedID', 'Name', 'Release.ReleaseDate' ]
			columnCfgs : [ 'FormattedID', 'Name', 'Release', 'Project','State', 'c_PATracking' ]
		});
		console.log("myStore: " + myStore.data.length);
		console.log(myStore);
		this.add(myGrid);
	}
});
