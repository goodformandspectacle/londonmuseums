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
    visitDetailId:    'js-visit-detail',
    visitMapId:       'js-visit-map',

    /**
     * Will be a list of all the processed data from the spreadsheet.
     */
    visitsData: [],

    /**
     * Will be a Leaflet map object.
     */
    map: false,

    /**
     * Will be the one marker on our map.
     */
    mapMarker: false,

    /**
     * Will be the Mapbox API Access Token.
     */
    mapboxToken: false,

    /**
     * Call visits.init() to start everything.
     *
     * config contains:
     *  * spreadsheet - The URL of the Google spreadsheet.
     *  * mapboxToken - API Access Token for Mapbox.
     */
    init: function(config) {

      this.mapboxToken = config['mapboxToken'];

      this.initTabletop(config.spreadsheet);

      this.initListeners();

    },

    initListeners: function() {
      var that = this;

      // Click a link in the table to display the visit's details.
      $('#' + this.tableContainerId).on('click', '.js-museum-link', function(ev){
        ev.preventDefault();

        var hash = $(this).prop('href').split('#')[1]; // eg 'v23'

        var visitID = hash.substring(1); // eg '23'.

        var visit = Sheetsee.getMatches(that.visitsData, visitID, "visitid")[0];

        that.displayVisit(visit);

        return false;
      });
    },

    initTabletop: function(spreadsheet) {
      var that = this;
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

      $('.js-loading').hide();

      var tableOptions = {
        data:       this.visitsData,
        pagination: 30,
        tableDiv:   '#' + this.tableContainerId,
        filterDiv:  '#' + this.tableFilterId
      };

      Sheetsee.makeTable(tableOptions);
      Sheetsee.initiateTableFilter(tableOptions)

      this.displayInitialVisit();
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
            data[idx]['visitid'] = parseInt(parts[1], 10);
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
     * Display a visit detail when the page loads.
     */
    displayInitialVisit: function() {
      // Get most recent visit, assuming visit IDs work like that:
      var visit = Sheetsee.getMax(this.visitsData, 'visitid')[0];
      this.displayVisit(visit);
    },

    /**
     * Display the details for a single visit.
     * visit is an object, one row from the spreadsheet.
     */
    displayVisit: function(visit) {

      var html = Sheetsee.ich[this.visitDetailId+'_template'](visit);

      $('#' + this.visitDetailId).html(html);

      this.displayVisitMap(visit);
    },

    displayVisitMap: function(visit) {
      console.log(visit);
      if (visit.lat == '' || visit.lon == '') {
        $('#'+this.visitMapId).hide();
        return;
      };

      $('#'+this.visitMapId).show();

      if (! this.map) {
        this.map =  L.map(this.visitMapId);

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
          maxZoom: 18,
          id: 'mapbox.streets',
          accessToken: this.mapboxToken
        }).addTo(this.map);
      };

      // We only want one marker on the map at a time.
      if (this.mapMarker) {
        this.map.removeLayer(this.mapMarker);
      };

      this.map.setView([visit.lat, visit.lon], 13);

      this.mapMarker = L.marker([visit.lat, visit.lon]).addTo(this.map);
    }


  }

}());

