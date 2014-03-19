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
					this._loadFeatures(releases, projects, programs);
				}
			}
		});
	},

    _loadFeatures : function(releases, projects, programs) {
      
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
								
								if (projects.get(featureProjectRefID)) {
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
								}
    						}
    					}
    				}, this); // end Ext.Array.each(myStore.getRecords(), function(feature)
    			} // end load
    		} // end listeners
    	}); // end Ext.create('Rally.data.wsapi.Store'
    } // end _loadFeatures
}); // end Ext.define('CustomApp'
