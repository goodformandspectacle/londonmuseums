/**
 * Calling visits.init() should initialise all other modules.
 */
;(function() {
  'use strict';
  window.visits = window.visits || {};
  var $ = window.jQuery;

  /**
   * This should init all of the modules that we want to initialise.
   */
  visits = {

    tableContainerId: 'js-museums-table',
    tableFilterId:    'js-museums-table-filter',

    /**
     * Call visits.init() to start everything.
     *
     * config contains:
     *  * spreadsheet - The URL of the Google spreadsheet.
     */
    init: function(config) {

      this.initTabletop(config.spreadsheet);

    },

    initTabletop: function(spreadsheet) {
      var that = this;
        console.log('loaded');
        var gData;
        var URL = spreadsheet;
        Tabletop.init( {
          key: URL,
          // Keep 'this' in context in the callback:
          callback: (that.callback).bind(that),
          simpleSheet: true
        } );
    },

    /**
     * Display the table.
     * data is the array of data from the spreadsheet.
     */
    callback: function(data, tabletop) {

      console.log(data);

      $('.js-loading').hide();

      var tableOptions = {
        data:       data,
        pagination: 30,
        tableDiv:   '#' + this.tableContainerId,
        filterDiv:  '#' + this.tableFilterId
      };

      Sheetsee.makeTable(tableOptions);
      Sheetsee.initiateTableFilter(tableOptions)
    }
  }

}());

