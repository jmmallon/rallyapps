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

		var programs = ['CGCS', 'VxWorks ST', 'IOT', 'Networking',
		                    'OVP', 'Linux', 'VxWorks 653 3.0', 'VxWorks 7', 'Tools'];

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
														var program = projects.get(featureProjectRefID);
														console.log(program);
														if (! total.get(program)) {
															total.add(program, 1);
														}
														else {
															var totalTmp = total.get(program);
															totalTmp++;
															total.replace(program, totalTmp);
														}
														console.log(total.get(program));
														var featureTracking = feature.get('c_PATracking');
														// console.log(featureTracking);
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
														console.log(reviewed.get(program));
														var featureState = feature.get('State');
														if (featureState != null) {
															featureStateName = featureState._refObjectName;
															// console.log(featureStateName);
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
															console.log(validated.get(program));
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
