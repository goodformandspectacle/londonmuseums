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

    tableContainerId:   'js-visits-table',
    tableFilterId:      'js-visits-table-filter',
    tableFilterInputId: 'js-visits-table-filter-input',
    tableDescriptionId: 'js-visits-table-description',
    visitDetailId:      'js-visit-detail',
    visitMapId:         'js-visit-map',

    /**
     * Will be a list of ALL the processed data from the spreadsheet.
     */
    visitsData: [],

    /**
     * Will be the subset of visitsData currently used in the table.
     * eg, might be filtered by yearopened.
     */
    tableData: [],

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

        var visit = that.getVisitFromId(visitId);

        that.setLocation({'visit': visitId}, visit.name);

        $('html, body').animate({
          scrollTop: $("#" + that.visitDetailId).offset().top
        }, 300);
      });

      // When back/forward button is pressed.
      $(window).on('statechange', function() {
        var state = History.getState();
        that.setContent(state.data);
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
     * Returns the row of data for the visitId.
     */
    getVisitFromId: function(visitId) {
      return Sheetsee.getMatches(
                            this.visitsData, visitId.toString(), 'visitid')[0];
    },

    /**
     * Sets the URL and the page content.
     * stateObj - An object passed to pushState.
     *            eg, {'visit': 23}
     * title - The Title of the page.
     */
    setLocation: function(stateObj, title) {
      var url = '';

      if ('visit' in stateObj) {
        url = this.urlRoot + 'visit/' + stateObj['visit'];
      };

      History.pushState(stateObj, this.makePageTitle(title), url);

      this.setContent(stateObj);
    },

    /**
     * Set the content of the page based on stateObj.
     */
    setContent: function(stateObj) {
      // eg {'visit': 23}:
      if ('visit' in stateObj) {
        this.displayVisit(stateObj['visit']);
      };
    },

    /**
     * Given a page title, make the complete page title and return it.
     */
    makePageTitle: function(title) {
      if (title) {
        return title + ' (' + this.siteTitle + ')';
      } else {
        return this.siteTitle;
      }
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

      this.doRouting();
    },

    /**
     * From the URL (on first load) decide what to show.
     */
    doRouting: function() {
      var urlParts = window.location.href.split('/');
      // eg, 'visits' or 'opened':
      var urlPart1 = urlParts[urlParts.length - 2];
      // eg '23' or '1991':
      var urlPart2 = urlParts[urlParts.length - 1];

      // We will use these to set the page content at the end.
      var tableVisits = [];
      var visitToDisplay = false;
      var pageTitle = '';
      var pageUrl = window.location.href;
      var tableDescriptionHtml = '';


      if (urlPart1 == 'visit') {
        // /visits/23

        var visitId = urlPart2;
        visits = Sheetsee.getMatches(this.visitsData, visitId, 'visitid');

        if (visits.length > 0) {
          // Yes, the visit ID matches one in the data, so use that.
          visitToDisplay = visits[0];
          pageTitle = visitToDisplay.name;
        } else {
          visitToDisplay = false;
        };

        // All of them.
        tableVisits = this.visitsData;

      } else if (urlPart1 == 'year') {
        // /year/1941

        var year = urlPart2;

        // First put all the visits matching any criteria in this array:
        // This may well included duplicate visits.
        var visits = [];
        visits = visits.concat(Sheetsee.getMatches(
                                        this.visitsData, year, 'yearbuilt'));
        visits = visits.concat(Sheetsee.getMatches(
                                        this.visitsData, year, 'yearfounded'));
        visits = visits.concat(Sheetsee.getMatches(
                                        this.visitsData, year, 'yearopened'));
        visits = visits.concat(Sheetsee.getMatches(
                                      this.visitsData, year, 'yearreopened'));

        // Will store the list of visitIds we've added to tableVisits so far:
        var addedVisits = [];
        // Go through visits and add each one to tableVisits only once:
        for(var i=0; i<visits.length; ++i) {
          if (addedVisits.indexOf(visits[i].visitid) == -1) {
            addedVisits.push(visits[i].visitid);
            tableVisits.push(visits[i]);
          };
        };

        pageTitle = year;

        var message = '';
        if (tableVisits.length == 0) {
          message = "There are no places built, founded or opened in " + year + '.';
        } else {
          message = "Places built, founded, or opened in " + year + '.';
          // Display most recent visit from this subset:
          visitToDisplay = Sheetsee.getMax(tableVisits, 'visitid')[0]
        };

        tableDescriptionHtml = "<strong>"+message+'</strong> | <a href="' + this.urlRoot + '">Clear</a>';

      } else {
        // /  (Default front page).

        tableVisits = this.visitsData;
        // Display most recent visit.
        visitToDisplay = Sheetsee.getMax(tableVisits, 'visitid')[0]
        pageUrl = this.urlRoot;
      };

      this.makeTable(tableVisits);

      if (tableDescriptionHtml) {
        $('#'+this.tableDescriptionId).show().html(tableDescriptionHtml);
      } else {
        $('#'+this.tableDescriptionId).hide();
      };

      var stateObj = {};

      if (visitToDisplay) {
        this.displayVisit(visitToDisplay.visitid);
        stateObj = {'visit': visitToDisplay.visitid};
      };

      History.pushState(
        stateObj,
        this.makePageTitle(pageTitle),
        pageUrl
      );
    },

    /**
     * Create the table from the supplied data.
     */
    makeTable: function(tableData) {
      if (tableData.length == 0) {
        $('#'+this.tableFilterId).hide();

      } else {
        $('#'+this.tableFilterId).show();
        var tableOptions = {
          data:       tableData,
          pagination: 30,
          tableDiv:   '#' + this.tableContainerId,
          filterDiv:  '#' + this.tableFilterInputId
        };

        Sheetsee.makeTable(tableOptions);
        Sheetsee.initiateTableFilter(tableOptions)
      };
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

        if ('datevisited' in visit && visit['datevisited'] != '') {
          // Take a date like '31-Aug-2016' and make it '2016-08-31'.
          // So we can sort by this in the table.
          data[idx]['datevisited'] = reverseDate(visit['datevisited']);
        };

        // Make a numeric visitid from the 'gfs:visit=37' data.
        if ('id' in visit && visit['id'] != '') {
          var parts = visit['id'].split('=');
          if (parts.length == 2) {
            data[idx]['visitid'] = parseInt(parts[1], 10);
          };
        };

        // Defaults:
        data[idx]['yearopened'] = '';
        data[idx]['yearreopened'] = '';
        data[idx]['yearfounded'] = '';
        data[idx]['yearbuilt'] = '';

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

      function sort_by_datevisited(a,b) {
        if (a.datevisited< b.datevisited)
          return -1;
        if (a.datevisited> b.datevisited)
          return 1;
        return 0;
      };

      // We want to have the most-recent item at the top of the table.
      data = data.sort(sort_by_datevisited);
      data.reverse();

      return data;
    },

    /**
     * Display the details, including map, for a single visit.
     */
    displayVisit: function(visitId) {
      var visit = Sheetsee.getMatches(
                            this.visitsData, visitId.toString(), 'visitid')[0];

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

