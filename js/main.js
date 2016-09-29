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
     * Set in init().
     */
    mapboxToken: false,

    /**
     * eg '/'. Set in init().
     */
    urlRoot: '',


    /**
     * Appended to changed page titles.
     * Set in init().
     */
    siteTitle: '',

    /**
     * Call visits.init() to start everything.
     *
     * config contains:
     *  * spreadsheet - The URL of the Google spreadsheet.
     *  * mapboxToken - API Access Token for Mapbox.
     *  * urlRoot - eg, '/'.
     */
    init: function(config) {

      this.mapboxToken = config['mapboxToken'] || '';
      this.urlRoot = config['urlRoot'] || '/';
      this.siteTitle = config['siteTitle'] || '/';

      this.initData(config.spreadsheet);

      this.initListeners();
    },

    initListeners: function() {
      var that = this;

      // Click a link in the table to display the visit's details.
      $('#' + this.tableContainerId).on('click', '.js-museum-link', function(ev){
        ev.preventDefault();

        var urlParts = $(this).prop('href').split('/');
        // eg '23':
        var visitId = urlParts[urlParts.length - 1];

        var visit = Sheetsee.getMatches(that.visitsData, visitId, 'visitid')[0];

        that.displayVisit(visit);

        that.setLocation({'visit': visitId}, visit.name);

        $('html, body').animate({
          scrollTop: $("#" + that.visitDetailId).offset().top
        }, 300);
      });
    },

    /**
     * Get the data from the Google Spreadsheet.
     * Once fetched, it's passed off to the callback to do stuff with it.
     */
    initData: function(spreadsheet) {
      var that = this;
        var gData;
        var URL = spreadsheet;
        Tabletop.init( {
          key: URL,
          // Keep 'this' in context in the callback:
          callback: (that.tabletopCallback).bind(that),
          simpleSheet: true
        } );
    },

    /**
     * Sets the URL.
     * stateObj - An object passed to pushState.
     *            eg, {'visit': 23}
     * title - The Title of the page.
     */
    setLocation: function(stateObj, title) {
      var url = '';

      if ('visit' in stateObj) {
        url = this.urlRoot + 'visit/' + stateObj['visit'];
      };

      title = this.makePageTitle(title);
      History.pushState(stateObj, title, url);
    },

    /**
     * Given a page title, make the complete page title and return it.
     */
    makePageTitle: function(title) {
      return title + ' (' + this.siteTitle + ')';
    },

    /**
     * Set the page title, used when we want to change the title on first load.
     * Otherwise, History.pushState() does it for us.
     * via http://stackoverflow.com/a/27692636/250962
     */
    setPageTitle: function(title) {
      title = this.makePageTitle(title);

      try {
          document.getElementsByTagName('title')[0].innerHTML = title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
      }
      catch ( Exception ) { }
      document.title = title;
    },

    /**
     * Display the table.
     * data is the array of data from the spreadsheet.
     */
    tabletopCallback: function(data, tabletop) {
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

      // Take a date like '31-Aug-2016' and return '2016-08-31'.
      function reverseDate(d) {
        var months = {'Jan':'01', 'Feb':'02', 'Mar':'03', 'Apr':'04',
        'May':'05', 'Jun':'06', 'Jul':'07', 'Aug':'08', 'Sep':'09', 'Oct':'10',
        'Nov':'11', 'Dec':'12'};

        var parts = d.split('-');

        var day = parts[0];
        if (day.length < 2) { day = '0'+day; };
        var month = months[parts[1]];
        var year = parts[2];

        return year + '-' + month + '-' + day;
      };

      $.each(data, function(idx, visit) {

        // Will be like '2016-08-31', so we can sort on it:
        data[idx]['datevisitedreverse'] = '';

        if ('datevisited' in visit && visit['datevisited'] != '') {
          data[idx]['datevisitedreverse'] = reverseDate(visit['datevisited']);
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

      function sort_by_datevisitedreverse(a,b) {
        if (a.datevisitedreverse < b.datevisitedreverse)
          return -1;
        if (a.datevisitedreverse > b.datevisitedreverse)
          return 1;
        return 0;
      };

      // We want to have the most-recent item at the top of the table.
      data = data.sort(sort_by_datevisitedreverse);
      data.reverse();

      return data;
    },

    /**
     * Display a visit detail when the page loads.
     */
    displayInitialVisit: function() {
      var visits = [],
          visit,
          visitId;

      // See if the URL ends like '/visit/23':
      var urlParts = window.location.href.split('/');
      if (urlParts[urlParts.length - 2] == 'visit') {
        visitId = urlParts[urlParts.length - 1];
      };

      if (visitId) {
        visits = Sheetsee.getMatches(this.visitsData, visitId, 'visitid');
      };

      if (visits.length > 0) {
        // Yes, the visit ID matches one in the data, so use that.
        visit = visits[0];
        this.setPageTitle(visit.name);
      } else {
        // Get most recent visit, assuming visit IDs work like that:
        visit = Sheetsee.getMax(this.visitsData, 'visitid')[0];
      };

      this.displayVisit(visit);
    },

    /**
     * Display the details, including map, for a single visit.
     * visit is an object, one row from the spreadsheet.
     */
    displayVisit: function(visit) {

      var html = Sheetsee.ich[this.visitDetailId+'_template'](visit);

      $('#' + this.visitDetailId).html(html);

      this.displayVisitMap(visit);

      $('#'+this.tableContainerId+' .is-active').removeClass('is-active');
      $('.js-visit-'+visit.visitid).addClass('is-active');
    },

    /**
     * Display the map of the visit location.
     * But if the visit has no lat/lon, then hide the map.
     * visit is an object, one row from the spreadsheet.
     */
    displayVisitMap: function(visit) {
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

