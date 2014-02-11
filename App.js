Ext.define('CustomApp', {
	extend : 'Rally.app.App',
	componentCls : 'app',
	launch : function() {
		this._loadData();
	},

	_loadData : function() {

		// Relevant programs
		
		var programs = ['CGCS', 'VxWorks ST', 'IOT', 'Networking',
	                    'OVP', 'Linux', 'VxWorks 653 3.0', 'VxWorks 7', 'Tools'];

		// All relevant programs and their programs
		
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

		// Prepare a filter to get all releases happening now
		// ReleaseStartDate <= today && ReleaseDate > today
		
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

					// Release must be happening now
					
					filters : releaseDatesFilter,
					autoLoad : true,
					listeners : {
						load : function(myStore, myData, mySuccess) {

							console.log("Loaded release data: " + myStore.data.length);

							// Create hash of relevant releases to filter features
							// Key will be the release ref ID, which the filter will have
							
							var releases = Ext.create('Ext.util.HashMap');
							Ext.Array.each(myStore.getRecords(), function(release) {
									releases.add(release.get('_ref'), [release.get('ReleaseStartDate'), release.get('ReleaseDate')]);
								}
							);

							// Get features
							// Rally filters cannot be too complex, so we must parse data after it has been received
							
							Ext.create('Rally.data.wsapi.Store', {
								model : 'PortfolioItem/Feature',
								fetch : [ 'FormattedID', 'Name', 'Release', 'Project', 'State', 'c_PATracking', 'UserStories' ],

								// Get all features
								
								limit : Infinity,

								// Limit to Product Lines project and its children

								context : {
									project : '/project/11089755042',
									projectScopeDown : true
								},

								autoLoad : true,
								listeners : {
									load : function(myStore, myData, mySuccess) {
										console.log("Loaded feature data: " + myStore.data.length);

										// Prepare hashes to store totals of feature data
										
										var total = Ext.create('Ext.util.HashMap');
										var reviewed = Ext.create('Ext.util.HashMap');
										var validated = Ext.create('Ext.util.HashMap');
										var hld = Ext.create('Ext.util.HashMap');
										var hldgreenlit = Ext.create('Ext.util.HashMap');
										
										// Get data from each feature
										
										Ext.Array.each(myStore.getRecords(), function(feature){
											var featureRelease = feature.get('Release');

											// Feature must have a Release to matter
											
											if (featureRelease != null) {
												var featureReleaseRef = featureRelease._ref;
												
												// Feature's release must be happening now
												
												if (releases.get(featureReleaseRef)) {
													var featureProject = feature.get('Project');
													var featureProjectRef = featureProject._ref;
													var featureProjectRefID = featureProjectRef.split("/").pop(); 

													// Project must be relevant - see "projects" hash
													
													if (projects.get(featureProjectRefID)) {
														var program = projects.get(featureProjectRefID);

														// In Ext hashes, an element must first be added
														// On later passes, it can be incremented by
														// getting the original value, adding 1, and
														// replacing the original value in the hash
														
														// Increment number of features for program

														if (! total.get(program)) {
															total.add(program, 1);
														}
														else {
															var totalTmp = total.get(program);
															totalTmp++;
															total.replace(program, totalTmp);
														}

														// Check tracking status
														
														var featureTracking = feature.get('c_PATracking');

														// Increment number of reviewed features for program
														
														if (featureTracking == "Review") {
															if (! reviewed.get(program)) {
																reviewed.add(program, 1);
															}
															else {
																var reviewedTmp = reviewed.get(program);
																reviewedTmp++;
																reviewed.replace(program, reviewedTmp);
															}
														}

														// Check feature state
														
														var featureState = feature.get('State');

														// Increment number of reviewed features for program
														
														if (featureState != null) {
															featureStateName = featureState._refObjectName;
															if (featureStateName == "Done") {
																if (! validated.get(program)) {
																	validated.add(program, 1);
																}
																else {
																	var validatedTmp = validated.get(program);
																	validatedTmp++;
																	validated.replace(program, validatedTmp);
																}
															}
														}
														
													}
												}
											}
											else {
												myStore.remove(feature);
											}
										}
										);

										// Create and populate a data store of the feature data
										
										Ext.define('featureData', {
										    extend: 'Ext.data.Model',
										    fields: [
										        {name: 'program', type: 'string'},
										        {name: 'total', type: 'int'},
										        {name: 'reviewed', type: 'int'},
										        {name: 'validated', type: 'int'}
										    ]
										});
										var featureStore = Ext.create('Ext.data.Store', {
											model: featureData
										});

										for (i = 0; i < programs.length; i++) {
											var programTmp = programs[i];
											var totalTmp = 0;
											var reviewedTmp = 0;
											var validatedTmp = 0;
											if (total.get(programTmp)) {
												totalTmp = total.get(programTmp);
											}
											if (reviewed.get(programTmp)) {
												reviewedTmp = reviewed.get(programTmp);
											}
											if (validated.get(programTmp)) {
												validatedTmp = validated.get(programTmp);
											}
											
											featureStore.add({program: programTmp, total: totalTmp, reviewed: reviewedTmp, validated: validatedTmp})
										}

										console.log(featureStore);
										console.log(myStore.data.length);
										
										this._loadGrid(featureStore);
									},
									scope : this
								}
							});
						},
						scope : this
					}
				});

	},

	_loadGrid : function(myStore) {

		var myGrid = Ext.create('Ext.grid.Panel', {
		    title: 'PT Dashboard',
		    store: myStore,
		    columns: [
		        { text: 'Program',  dataIndex: 'program' },
		        { text: 'Total Features', dataIndex: 'total'},
		        { text: 'Reviewed Features', dataIndex: 'reviewed' },
		        { text: 'Validated Features', dataIndex: 'validated' }
		    ]
		});
		/**
		var myGrid = Ext.create('Rally.ui.grid.Grid', {
			store : myStore,
			// columnCfgs : [ 'FormattedID', 'Name', 'Release.ReleaseDate' ]
			columnCfgs : [ 'FormattedID', 'Name', 'Release', 'Project','State', 'c_PATracking' ]
		});
		**/
		console.log("myStore: " + myStore.data.length);
		console.log(myStore);
		this.add(myGrid);
	}
});
