Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
      var myStore = Ext.create('Rally.data.wsapi.Store', {
        model: 'User Story',
        autoLoad: true,
        listeners: {
          load: function(myStore, myData, mySuccess) {
            console.log("Got it: ", myStore, myData, mySuccess);
            var myGrid = Ext.create('Rally.ui.grid.Grid', {
	      store: myStore,
	      columnCfgs: [ 'FormattedID', 'Name', 'ScheduleState']
            });
	    this.add(myGrid);
          },
	  scope: this
        },
        fetch: [ 'FormattedID', 'Name', 'ScheduleState']
      });
    }
});
