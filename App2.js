// This app loads feature data for all Product Line features whose releases are happening now
// Total features, Reviewed features, Validated features, HLDs, Greenlit HLDs

Ext.define('CustomApp', {
    extend : 'Rally.app.App',
    componentCls : 'app',
    launch : function() {
        this._loadReleases();
    },

	_loadReleases : function() {

		// Relevant programs
		
		var programs = ['CGCS', 'VxWorks ST', 'IOT', 'Networking',
	                    'OVP', 'Linux', 'VxWorks 653 3.0', 'VxWorks 7', 'Tools'];

		// All relevant programs and their programs
		
		var projectNames = Ext.create('Ext.util.HashMap');
		projectNames.add('10253738811', 'Vx-7 Project');
		projectNames.add('10479834443', 'IDP');
		projectNames.add('10957142069', 'Linux OVP');
		projectNames.add('11424998698', 'Vx-7 Infrastructure');
		projectNames.add('11424999507', 'Vx-7 Hardware Arch & BSP');
		projectNames.add('11470176273', 'Linux Core');
		projectNames.add('11490019566', 'Vx-7 Hardware Architecture');
		projectNames.add('11490173498', 'Vx-7 Bootloader');
		projectNames.add('12168776634', 'Workbench 3.3.x');
		projectNames.add('12405728916', 'Tools for Vx-7');
		projectNames.add('12868082229', 'Tools for VxWorks ST');
		projectNames.add('12890367855', 'Vx-7 Platform Enablement Common');
		projectNames.add('13245546162', 'XPD');
		projectNames.add('13420058203', 'IOT');
		projectNames.add('13538110755', 'CGTelcoServer');
		projectNames.add('13744307332', 'VxWorks 653 3.x');
		projectNames.add('15106843053', 'Workbench 3.x');
		projectNames.add('15267702952', 'VxWorks Hypervisor 3.0 Program');
		projectNames.add('9740387440', 'INP');

		var projectPrograms = Ext.create('Ext.util.HashMap');
		projectPrograms.add('13538110755', 'CGCS');
		projectPrograms.add('15267702952', 'VxWorks ST');
		projectPrograms.add('10479834443', 'IOT');
		projectPrograms.add('13420058203', 'IOT');
		projectPrograms.add('9740387440', 'Networking');
		projectPrograms.add('13245546162', 'Networking');
		projectPrograms.add('10957142069', 'OVP');
		projectPrograms.add('11470176273', 'Linux');
		projectPrograms.add('13744307332', 'VxWorks 653 3.0');
		projectPrograms.add('10253738811', 'VxWorks 7');
		projectPrograms.add('11490173498', 'VxWorks 7');
		projectPrograms.add('11424999507', 'VxWorks 7');
		projectPrograms.add('11490019566', 'VxWorks 7');
		projectPrograms.add('11424998698', 'VxWorks 7');
		projectPrograms.add('12890367855', 'VxWorks 7');
		projectPrograms.add('12405728916', 'Tools');
		projectPrograms.add('12868082229', 'Tools');
		projectPrograms.add('15106843053', 'Tools');
		projectPrograms.add('12168776634', 'Tools');

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

		Ext.create('Rally.data.wsapi.Store', {
			model : 'Release',
			fetch : [ 'FormattedID', 'Name', 'ReleaseDate', 'ReleaseStartDate' ],

    		// Limit to Product Lines project and its children

			context : {
				project : '/project/11089755042',
				projectScopeDown : true
			},

    		// Get all available releases in one fetch

			limit : Infinity,

			// Release must be happening now

			filters : releaseDatesFilter,
			autoLoad : true,
			listeners : {
				scope : this,
				load : function(myStore, myData, mySuccess) {

					console.log("Loaded release data: " + myStore.data.length);

					// Create hash of relevant releases to filter features
					// Key will be the release ref ID, which the filter will have

					var releases = Ext.create('Ext.util.HashMap');
					Ext.Array.each(myStore.getRecords(), function(release) {
						releases.add(release.get('_ref'), [release.get('ReleaseStartDate'), release.get('ReleaseDate')]);
					});
					this._loadFeatures(releases, projectNames, projectPrograms, programs);
				}
			}
		});
	},

	_addToHash : function(hash, subscript, amount) {
		
		// In Ext hashes, an element must first be added
		// On later passes, it can be incremented by
		// getting the original value, adding 1, and
		// replacing the original value in the hash

		if (! hash.get(subscript)) {
			hash.add(subscript, amount);
		}
		else {
			var hashTmp = hash.get(subscript);
			hashTmp = hashTmp + amount;
			hash.replace(subscript, hashTmp);
		}		
	},
	
    _loadFeatures : function(releases, projectNames, projectPrograms, programs) {
      
    	// Get features
    	// Rally filters cannot be too complex, so we must
    	// parse data after it has been received

    	Ext.create('Rally.data.wsapi.Store', {
    		model : 'PortfolioItem/Feature',
    		fetch : [ 'FormattedID', 'Name', 'Release', 'Project', 'State', 'c_PATracking', 'UserStories' ],

    		// Limit to Product Lines project and its children

    		context : {
    			project : '/project/11089755042',
    			projectScopeDown : true
    		},

    		// Get all available features in one fetch

			limit : Infinity,
    		autoLoad : true,
    		listeners : {
    			scope: this,
    			load : function(myStore, myData, mySuccess) {

    				console.log("Loaded feature data: " + myStore.data.length);

					// Prepare hashes to store totals of feature data
					
					var total = Ext.create('Ext.util.HashMap');
					var reviewed = Ext.create('Ext.util.HashMap');
					var validated = Ext.create('Ext.util.HashMap');
					var hld = Ext.create('Ext.util.HashMap');
					var hldgreenlit = Ext.create('Ext.util.HashMap');
					
    				var features = [];
    				var pendingFeatures = myData.length;
    				Ext.Array.each(myStore.getRecords(), function(feature) {
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
								
								if (projectNames.get(featureProjectRefID) && projectPrograms.get(featureProjectRefID)) {
									
									// Increment number of features for project

									this._addToHash(total, featureProjectRefID, 1);
									
									// Check tracking status
									
									var featureTracking = feature.get('c_PATracking');

									// Increment number of reviewed features for program
									
									if (featureTracking == "Review") {
										this._addToHash(reviewed, featureProjectRefID, 1);
									}

									// Check feature state
									
									var featureState = feature.get('State');

									// Increment number of validated features for program
									
									if (featureState != null) {
										featureStateName = featureState._refObjectName;
										if (featureStateName == "Done") {
											this._addToHash(validated, featureProjectRefID, 1);
										}
									}
/*									
									var featureObject = {
											release: feature.get('Release'),
											project: feature.get('Project'),
											tracking: feature.get('c_PATracking'),
											state: feature.get('State'),
											userStories: []
									};

									
									
									var userStories = feature.getCollection('UserStories');
									userStories.load({
										fetch: ['FormattedID', 'ScheduleState', 'c_PAHLD'],
										callback: function(records, operation, success) {
											Ext.Array.each(records, function(userstory) {
												featureObject.userStories.push(userstory);
											}, this);
											--pendingFeatures;
											console.log(pendingFeatures);
											if (pendingFeatures === 0) {
												console.log(features);
												// this._processData(features)
											}
										},
										scope: this
									}); // end userStories.load
									features.push(featureObject);
*/
								} // end if (projectNames.get(featureProjectRefID) && projectPrograms.get(featureProjectRefID))
    						} // end if (releases.get(featureReleaseRef)) 
    					} // end if (featureRelease != null)
    				}, this); // end Ext.Array.each(myStore.getRecords(), function(feature)
    				
					// Create and populate a data store of the feature data
					
					Ext.define('featureData', {
					    extend: 'Ext.data.Model',
					    fields: [
					        {name: 'item', type: 'string'},
					        {name: 'total', type: 'int'},
					        {name: 'reviewed', type: 'int'},
					        {name: 'validated', type: 'int'}
					    ]
					});
					var featureStore = Ext.create('Ext.data.Store', {
						model: featureData
					});

					// We have totals for each project
					// We will generate totals for each program
					
					var programTotal = Ext.create('Ext.util.HashMap');
					var programReviewed = Ext.create('Ext.util.HashMap');
					var programValidated = Ext.create('Ext.util.HashMap');

					// Cycle through the projects, creating an entry for each and adding
					// its total to the program total

					projectNames.each(function(key, value, length){
						var projectID = key;
						var projectName = value;
						var projectProgram = projectPrograms.get(projectID);
						
						// Format the name
						
						var name = projectProgram + ": " + projectName;
						var totalTmp = 0;
						var reviewedTmp = 0;
						var validatedTmp = 0;

						// Get the stats total for the project and add it to the program total
						
						if (total.get(projectID)) {
							totalTmp = total.get(projectID);
							this._addToHash(programTotal, projectProgram, totalTmp);
						}
						if (reviewed.get(projectID)) {
							reviewedTmp = reviewed.get(projectID);
							this._addToHash(programReviewed, projectProgram, reviewedTmp);
						}
						if (validated.get(projectID)) {
							validatedTmp = validated.get(projectID);
							this._addToHash(programValidated, projectProgram, validatedTmp);
						}
						
						// Make an entry in the data store

						console.log("project: " + name + ", total: " + totalTmp + ", reviewed: " + reviewedTmp + ", validated: " + validatedTmp);
						featureStore.add({item: name, total: totalTmp, reviewed: reviewedTmp, validated: validatedTmp});
					}, this);

					// Compile data for the programs
					
					for (i = 0; i < programs.length; i++) {
						var programTmp = programs[i];
						var totalTmp = 0;
						var reviewedTmp = 0;
						var validatedTmp = 0;
						if (programTotal.get(programTmp)) {
							totalTmp = programTotal.get(programTmp);
						}
						if (programReviewed.get(programTmp)) {
							reviewedTmp = programReviewed.get(programTmp);
						}
						if (programValidated.get(programTmp)) {
							validatedTmp = programValidated.get(programTmp);
						}
						
						// Make an entry in the data store

						featureStore.add({item: programTmp, total: totalTmp, reviewed: reviewedTmp, validated: validatedTmp});
					}

					console.log(featureStore);
					
					this._loadGrid(featureStore);
    				
    			} // end load
    		} // end listeners
    	}); // end Ext.create('Rally.data.wsapi.Store'
    }, // end _loadFeatures

	_loadGrid : function(myStore) {

		// Create grid from data store
		
		var myGrid = Ext.create('Ext.grid.Panel', {
		    title: 'PT Dashboard',
		    store: myStore,
		    columns: [
		        { text: 'Program',  dataIndex: 'item', width: 300 },
		        { text: 'Current Features', dataIndex: 'total'},
		        { text: 'Reviewed Features', dataIndex: 'reviewed' },
		        { text: 'Validated Features', dataIndex: 'validated' }
		    ]
		});
		myGrid.store.sort([{property: 'item',  direction: 'ASC'}]);
		console.log(myStore);
		this.add(myGrid);
	}
}); // end Ext.define('CustomApp'
