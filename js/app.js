var map;
var markers = [];
var locations = [
  {title: 'Bangkok', location: {lat: 13.772431, lng: 100.493020}},
  {title: 'Chiang Mai', location: {lat: 18.713847, lng: 98.982887}},
];
var largeInfoWindow;
var linkContent;
var imgContent;

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 15.332587, lng: 101.037145},
    zoom: 12,
    mapTypeControl: false
  });
  // Creates infowindow object for a marker to display info
  largeInfoWindow = new google.maps.InfoWindow();
  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';

  // Uses the locations array to create an array of markers on initialize.
  locations.forEach(function(location, index) {
    // Get the position from the location array.
     var position = locations[index].location;
     var title = locations[index].title;

    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: index,
      map: map
    });

    // Push the marker to our array of markers.
    markers.push(marker);

    // Create an onclick event to open an infowindow at each marker.
    marker.addListener('click',function(){
      populateInfoWindow(this,largeInfoWindow);
    });

    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener('mouseover', function(){
      this.setIcon(highlightedIcon);
    });

    marker.addListener('mouseout', function(){
      this.setIcon(defaultIcon);
    });
  });
  showListings();
}

// Animate marker if clicked
function makeMarkerBounce(marker) {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function() {
    marker.setAnimation(null);
  }, 1400);
}

// This function populates the infowindow when the marker is clicked
// based on that markers position.
function populateInfoWindow(marker, infoWindow){
  // Animate marker if clicked
  makeMarkerBounce(marker);
  if(infoWindow.marker != marker){
    infoWindow.marker = marker;
    infoWindow.setContent('');
    getWikiData(marker);
    infoWindow.open(map,marker);
    infoWindow.addListener('closeclick', function(){
      infoWindow.marker = null;
    });
  }
}

// This function will loop through the markers array and display them all.
function showListings(){
  // Limits the map to display all the locations on the screen
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++){
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  // Extend the boundaries of the map for each marker
  map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideListings(){
  for(var i = 0; i < markers.length; i++){
    markers[i].setMap(null);
  }
}

function getLocation(value){
  if (largeInfoWindow.marker != value.location) {
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].title == value.title) {
        populateInfoWindow(markers[i], largeInfoWindow);
        break;
      }
    }
  }
}

// Handle Google Maps API error
function googleMapsError() {
  alert("Google Maps failed to load. Please try again.");
}

// Handle Wiki API error
function wikiApiError() {
  alert("Wiki failed to retrieve data. Please try again.");
}

// Get link & photo  from Wikipedia
function getWikiData(marker) {

  // API constants
  var API_HOST = 'https://en.wikipedia.org/w/api.php?';
  var SEARCH_PATH_1 = 'action=opensearch&search=';
  var CB = '&format=json&callback=wikiCallback';
  var SEARCH_PATH_2 = 'action=query&format=json&formatversion=2&prop=pageimages|pageterms&piprop=original&titles=';

  var url = API_HOST + SEARCH_PATH_1 + marker.title + CB;
  var url2 = API_HOST + SEARCH_PATH_2 + marker.title;

  $.ajax({
          url: url,
          dataType: "jsonp"
        }).done(function(response){

          var wikiDoc = response[3][0];
          linkContent = '<div>' + '<center><h3>' +
          '<a href ="' + wikiDoc +
           '" class="location-title" target="_blank">' +
           marker.title +'</a></h3></center></div>';

        }).fail(function(){
          wikiApiError();
        });

  var timeDelay = 70;
  setTimeout(secondAJAXCall, timeDelay);

  function secondAJAXCall() {

    $.ajax({
            url: url2,
            dataType: "jsonp"
          }).done(function(response){

            var wikiDoc2 = response.query.pages[0].original.source;
            imgContent = '<div class="location-image">' +
            '<center><img src="' + wikiDoc2 +
             '" height="180" width="220"></center>' + '</div><br>';

            //Set content with InfoWindow
             largeInfoWindow.setContent(linkContent + imgContent);
             showListings();
          }).fail(function(){
            wikiApiError();
          });
  }
}

// Defines the data and behavior of UI
var appViewModel = {
  query: ko.observable(''),
  locationList: ko.observableArray([]),

  // Store locations array into knockout array
  setLocations: function(query){
    for(var l in locations){
      appViewModel.locationList.push(locations[l]);
    }
  },

  // Search for input query
  searchQuery: function(query) {
    appViewModel.locationList.removeAll();

    for (var i = 0; i < markers.length; i++) {
      markers[i].setVisible(false);
    }

    for(var l in locations) {
      if(locations[l].title.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
        appViewModel.locationList.push(locations[l]);
        var knockoutMarker = locations[l].location;

        for (i = 0; i < markers.length; i++) {
          if (markers[i].position.lat().toFixed(5) == knockoutMarker.lat.toFixed(5) &&
              markers[i].position.lng().toFixed(5) == knockoutMarker.lng.toFixed(5)) {
                markers[i].setVisible(true);
          }
        }
      }
    }
  }
};

// Activate knockout.js
appViewModel.setLocations();
appViewModel.query.subscribe(appViewModel.searchQuery);
ko.applyBindings(appViewModel);
