Ext.define('CustomApp', {
	extend : 'Rally.app.App',
	componentCls : 'app',
	launch : function() {
		this._loadData();
	},

	_loadData : function() {
		var projects = Ext.create('Ext.util.HashMap');
		projects.add(,

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
								fetch : [ 'FormattedID', 'Name', 'Release', 'UserStories' ],
								limit : Infinity,
								context : {
									project : '/project/11089755042',
									projectScopeDown : true
								},
//								filters : releaseFilter,
								autoLoad : true,
								listeners : {
									load : function(myStore, myData, mySuccess) {
										console.log("Loaded feature data: " + myStore.data.length);

										Ext.Array.each(myStore.getRecords(), function(feature){
											var featureRelease = feature.get('Release');
											if (featureRelease != null) {
												var featureReleaseRef = featureRelease._ref;
												if (! releases.get(featureReleaseRef)) {
													myStore.remove(feature);
												}
											}
											else {
												myStore.remove(feature);
											}
										}
										);

										Ext.Array.each(myStore.getRecords(), function(feature){
											var featureRelease = feature.get('Release');
											if (featureRelease != null) {
												var featureReleaseRef = featureRelease._ref;
												if (! releases.get(featureReleaseRef)) {
													myStore.remove(feature);
												}
											}
											else {
												myStore.remove(feature);
											}
										}
										);
										console.log(myStore.data.length);
										
										this._loadGrid(myStore);
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

		// Use Ext.grid.Panel instead of Rally grid
		// Do computation here, create new store from myStore data
		// https://help.rallydev.com/apps/2.0rc2/doc/#!/api/Ext.grid.Panel

		var myGrid = Ext.create('Rally.ui.grid.Grid', {
			store : myStore,
			// columnCfgs : [ 'FormattedID', 'Name', 'Release.ReleaseDate' ]
			columnCfgs : [ 'FormattedID', 'Name', 'ReleaseDate',
					'ReleaseStartDate' ]
		});
		console.log("myStore: " + myStore.data.length);
		console.log(myStore);
		this.add(myGrid);
	}
});
