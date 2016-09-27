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

    tableContainerId: 'js-visits-table',
    tableFilterId:    'js-visits-table-filter',
    visitInfoId:      'js-visit-info',

    /**
     * Will be a list of all the processed data from the spreadsheet.
     */
    visitsData: [],

    /**
     * Will map a visit ID to a row index in visitsData.
     */
    visitsLookup: {},

    /**
     * Call visits.init() to start everything.
     *
     * config contains:
     *  * spreadsheet - The URL of the Google spreadsheet.
     */
    init: function(config) {

      this.initTabletop(config.spreadsheet);

      this.initListeners();

    },

    initListeners: function() {
      var that = this;

      // Click a link in the table to display the visit's details.
      $('#' + this.tableContainerId).on('click', '.js-museum-link', function(ev){
        ev.preventDefault();

        // eg, 'v23':
        var hash = $(this).prop('href').split('#')[1];

        // eg, '23':
        var visitID = hash.substring(1);

        if (visitID) {
          that.displayVisit(visitID);
        };

        return false;
      });
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

      this.visitsData = this.processData(data);
      console.log(this.visitsData);

      $('.js-loading').hide();

      var tableOptions = {
        data:       this.visitsData,
        pagination: 30,
        tableDiv:   '#' + this.tableContainerId,
        filterDiv:  '#' + this.tableFilterId
      };

      Sheetsee.makeTable(tableOptions);
      Sheetsee.initiateTableFilter(tableOptions)
    },

    /**
     * Make a few changes to the data from the spreadsheet.
     */
    processData: function(data) {
      var that = this;

      $.each(data, function(idx, visit) {

        if ('datevisited' in visit && visit['datevisited'] != '') {
          data[idx]['datevisited'] = visit['datevisited'].replace(/-/g, ' ');
        };

        // Make a numeric visitid from the 'gfs:visit=37' data.
        if ('id' in visit && visit['id'] != '') {
          var parts = visit['id'].split('=');
          if (parts.length == 2) {
            data[idx]['visitid'] = parts[1];

            that.visitsLookup[parts[1]] = idx;
          };
        };

        // Get the various dates into their own fields.
        // Could be like "founded:1683, opened:1845".
        // We'll make yearfounded: '1683', yearopened: '1845',
        if ('foundedopenedbuilt' in visit && visit['foundedopenedbuilt'] != '') {
          var parts = visit['foundedopenedbuilt'].split(',');
          $.each(parts, function(n, part) {
            var [key, value] = part.split(':');
            data[idx]['year'+key.trim()] = value.trim();
          });
        };

        // Make Gender nicer to output.
        if ('directorgender' in visit && visit['directorgender'] != '') {
          if (visit['directorgender'] == 'F') {
            data[idx]['directorgender'] = 'Female';
          } else if (visit['directorgender'] == 'M') {
            data[idx]['directorgender'] = 'Male';
          } else if (visit['directorgender'] == 'M+F') {
            data[idx]['directorgender'] = 'Male and female';
          };
        };

        // Create some booleans so we can decide whether to show certain
        // blocks in the page.
        if (
            ('url' in visit && visit['url'] != '')
            ||
            ('wikipediaurl' in visit && visit['wikipediaurl'] != '')
            ||
            ('gfsblogpost' in visit && visit['gfsblogpost'] != '')
        ) {
            data[idx]['hasurl'] = true;
        };
        if (
            ('address' in visit && visit['address'] != '')
            ||
            ('city' in visit && visit['city'] != '')
            ||
            ('postcode' in visit && visit['postcode'] != '')
        ) {
            data[idx]['hasaddress'] = true;
        };

      });

      return data;
    },

    /**
     * Display the details for a single visit.
     */
    displayVisit: function(visitID) {
      if (!(visitID in this.visitsLookup)) {
        return;
      };

      var visit = this.visitsData[ this.visitsLookup[visitID] ];

      var html = Sheetsee.ich[this.visitInfoId+'_template'](visit);

      $('#' + this.visitInfoId).html(html);
    }

  }

}());

