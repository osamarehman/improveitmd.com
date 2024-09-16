//Credentials 

  // Check if mapboxgl.accessToken is already set, if not, set it
  if (!mapboxgl.accessToken) {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW1wcm92ZWl0bWQiLCJhIjoiY2w1OXlhZ3BnMDAyMDNrcG9pdmU3OXNvcyJ9.8IKtnRJwbi7ss5MjeHGAkQ';
  }



function extractAddressComponents(response) {
  if (!response || !response.features || !response.features.length) {
    return null;
  }

  const feature = response.features[0];
  const addressComponents = {
    short_address: '',
    city: '',
    state: '',
    zip: ''
  };

  // Extract the short address (e.g., "12660 Totem Lake Boulevard Northeast")
  if (feature.address && feature.text) {
    addressComponents.short_address = `${feature.address} ${feature.text}`;
    //DataStore.set('ShortAddress', addressComponents.short_address)
  }

  // Extract city, state and zip from the context
  feature.context.forEach(context => {
    if (context.id.startsWith('place.')) {
      addressComponents.city = context.text;
      DataStore.set('City', context.text)
    } else if (context.id.startsWith('region.')) {
      addressComponents.state = context.text;
      DataStore.set('State', context.text)
    } else if (context.id.startsWith('postcode.')) {
      addressComponents.zip = context.text;
      DataStore.set('Zip', context.text)
    }
  });

  return addressComponents;
}


let flowType = null;

  //Step 1 - First screen select option and display right flow
  function initFlow() {
    const singleOption = document.querySelector('[data-elem="single-option"]')
    const multiOption = document.querySelector('[data-elem="multi-option"]')
    const firstScreen = document.querySelector('[data-elem="first-screen"]')
    const singleScreen = document.querySelector('[data-elem="2nd-screen-single"]')
    const multiScreen = document.querySelector('[data-elem="2nd-screen-multi"]')




    singleOption.addEventListener('click', showSingleScreen)
    multiOption.addEventListener('click', showMultiScreen)

    function showSingleScreen() {
      firstScreen.classList.add('is--hidden')
      singleScreen.classList.remove('is--hidden')
      multiScreen.remove()
      flowType = "single";
      initializeSingleGeocoder(singleScreen)


    }
    function showMultiScreen() {
      firstScreen.classList.add('is--hidden')
      multiScreen.classList.remove('is--hidden')
      singleScreen.remove()
      flowType = "multiple";
      initializeGeocoder(multiScreen)


    }



    //Create geocoder functions to add to the single screen
    function initializeSingleGeocoder(wrapEle) {
      try {
        const geocodeWrap = wrapEle.querySelector('[data-elem="geocoder-wrap"]')
        const geocoder = geocodeWrap.querySelector('[data-elem="geocoder"]')
        const geocodeLoader = geocodeWrap.querySelector('.geocoder_loader')
        //console.log(initializeMapbox, 'wrap element')
        initializeMapbox(geocoder, geocodeWrap, geocodeLoader)
      }
      catch {
        console.error('geocoder can not be initialized')
      }
    }

    function initializeGeocoder(wrapEle) {
      try {
        //console.log(`Initializing geocoder for: `, wrapEle);

        // Select all geocodeWrap elements within the provided wrapEle
        const geocodeWraps = wrapEle.querySelectorAll('[data-elem="geocode-wrap"]');
        console.log(geocodeWraps)

        // Iterate over each geocodeWrap and perform initialization
        geocodeWraps.forEach(geocodeWrap => {
          const geocoder = geocodeWrap.querySelector('[data-elem="geocoder"]');
          const geocodeLoader = geocodeWrap.querySelector('.geocoder_loader');

          if (geocoder && geocodeLoader) {
            console.log('Initializing Mapbox for element:', geocoder);
            initializeMapbox(geocoder, geocodeWrap, geocodeLoader);
          } else {
            console.warn('Geocoder or loader element not found in this wrap.');
          }
        });
      } catch (error) {
        console.error('Geocoder cannot be initialized: ', error);
      }
    }
  }
  initFlow()


  //Step 2 - Initialize Counter and add more address functionality  
  let addCount = 0; // Initialize a counter
  const addButton = document.querySelector('[data-elem="add-new-add"]');
  const addButtonWrap = document.querySelector('[data-field="multi-geocode-add"]')


  function addGeocoder() {
    if (addCount < 2) { // Check if the counter is less than 3
      const geocoderWrap = document.querySelector('[data-elem="geocode-wrap"]');
      const parentElement = document.querySelectorAll('[data-elem="geocoder-wrap"]')[0];
      const lastChild = parentElement.querySelector('[data-elem="multi-prop-last"]');
      const newGeocoder = geocoderWrap.cloneNode(true)
      const newGeocodeLoader = newGeocoder.querySelector('.geocoder_loader')
      const newGeocode = newGeocoder.querySelector('[data-elem="geocoder"]')
      newGeocoder.querySelector('[data-elem="add-sus"]').textContent = addCount + 3
      newGeocodeLoader.style.display = 'block'
      newGeocode.style.display = 'none'
      newGeocode.innerHTML = ""

      //Also add related Map size node for each geocoder

      const sizeMapWrapper = document.querySelector('[data-elem="multi-map-wrap"]');

      const sizeMap = document.querySelector('[data-elem="multi-size-wrap"]');
      const sizeMapWrapLastChild = sizeMapWrapper.lastChild

      const newSizeMap = sizeMap.cloneNode(true)
      let count = addCount + 3

      newSizeMap.querySelector('[data-elem="map"]').id = `map${count}`



      newSizeMap.querySelector('[data-element="prompt-1"]').remove()

      sizeMapWrapper.insertBefore(newSizeMap, sizeMapWrapLastChild)


      parentElement.insertBefore(newGeocoder, lastChild); // Clone to add a new element
      initializeMapbox(newGeocode, newGeocoder, newGeocodeLoader)

      initFlow()

      addCount++; // Increment the counter
      // Disable the button if three elements have been added
      if (addCount === 2) {
        addButtonWrap.style.display = 'none'; // Disable the button
      }
    } else {
      console.log("You can only add this element three times.");
    }
  }


  addButton.addEventListener('click', addGeocoder);



function thirdScreen(flowtype) {
  if (flowtype === "multiple") {

    document.querySelector('[data-elem="multi-next-button-1"]').addEventListener('click', function () {
      console.log('next button clicked')
      document.querySelector('[data-elem="geocoder-wrap"]').classList.add('is--hidden')
      document.querySelector('[data-elem="multi-map-wrap"]').classList.remove('is--hidden')

      //console.log(addressSearched)
    })


  }
  else {
    document.querySelector('[data-elem="size-wrap"]').classList.remove('is--hidden')
    document.querySelector('[data-elem="geocoder-wrap"]').classList.add('is--hidden')
  }
  processAddresses(addressSearched)
}

let addressSearched = {};
//Step 3 - Initialize Mapbox Geocoder 


function initializeMapbox(geocoderElem, geocodeWrapper, geocodeLoader) {
  try {

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      countries: 'us',
      filter: function (item) {
        // returns true if item contains Maryland or Washington
        return item.context.some((i) => {

          i.id.split('.').shift() === 'region'
          //console.log(i.id.split('.').shift())
          var region;
          if (i.text === "Maryland") {
            //console.log(i.text)
            region = true
          } else if (i.text === "Washington") {
            // console.log(i.text)
            region = true
          } else if (i.text === "Virginia") {
            region = true
          }

          else {
            //console.log(i.text)
            region = false;
          }
          // console.log(region)
          return (region)
        });
      },
      mapboxgl: mapboxgl
    });
    geocoder.addTo(geocoderElem);
    geocodeLoader.style.display = 'none';
    geocoderElem.style.display = 'block';

   

      console.log('flow type', flowType
      )
      
      // const inputField = $(geocodeWrapper).find('.mapboxgl-ctrl-geocoder--input'); 
      //console.log(inputField, 'input field geocoder')
      $(geocoderElem).css('transition', 'margin-bottom 0.5s ease');
      // $(inputField).on('input', () => {
      //   //geocodeWrapper.style.marginBottom = '50vh';
      //   console.log('input on geocoder')
       
      //       });
    

    geocoder.on('loading', (query)=> {
      console.log(query, 'query')
      console.log('geocode loading', flowType, 'flowType', geocoderElem, 'geocoder elem')
      $(geocoderElem).css('margin-bottom', '40vh');
      if (flowType === "multiple"){
  }
})

    geocoder.on('result', (e) => {

      const fullAddress = e.result.place_name;
      const coordinates = e.result.geometry.coordinates;
      const addressComponents = {}

      e.result.context.forEach(context => {
        if (context.id.startsWith('place.')) {
          addressComponents.city = context.text;
        } else if (context.id.startsWith('region.')) {
          addressComponents.state = context.text;
        } else if (context.id.startsWith('postcode.')) {
          addressComponents.zip = context.text;

        }
      });
      //console.log(e.result, addressComponents, "components 2nd")
      if (flowType === "single") {
        addressSearched[1] = {
          address: fullAddress,
          coordinates: coordinates,
          short_address: addressComponents
        }
      } else {
        console.log('geocoder on results')
        $(geocoderElem).css('margin-bottom', '0');
        let addressNumber = geocodeWrapper?.querySelector('[data-elem="add-sus"]')?.textContent.trim()
        //geocodeWrapper.style.marginBottom = '0px'

        addressSearched[addressNumber] = {
          address: fullAddress,
          coordinates: coordinates,
          short_address: addressComponents
        };
      }

      //console.log(addressSearched)
      thirdScreen(flowType)

    });

    //Changing search bar placeholder text
    geocodeWrapper.querySelector('.mapboxgl-ctrl-geocoder--input').placeholder = 'Type your street address';
  } catch (error) {
    console.error('Error initializing Mapbox:', error);
    // Retry initialization after a delay
    setTimeout(initializeMapbox, 2000); // Wait 2 seconds before retrying
  }
}

// window.addEventListener('DOMContentLoaded', function(){
function main() {



  if (typeof mapboxgl !== 'undefined') {
    initializeMapbox();
  } else {
    var mapboxGLLoadedInterval = setInterval(function () {
      if (typeof mapboxgl !== 'undefined') {
        clearInterval(mapboxGLLoadedInterval);
        initializeMapbox();
      }
    }, 100); // Check every 100 milliseconds
  }
}


// main()



// Iterate over the addresses object
function processAddresses(addresses) {
  for (const key in addresses) {
    if (addresses.hasOwnProperty(key)) {
      const addressInfo = addresses[key];
      const lng = addressInfo.coordinates[0];
      const lat = addressInfo.coordinates[1];
      //console.log(addressInfo.coordinates); // Log coordinates for debugging
      let coordinates = [lng, lat]

      // Ensure the container ID is properly formatted
      let mapContainer = `map${key.trim()}`;
      let containerEle = document.getElementById(mapContainer); // Use getElementById
      const mapKey = key.trim()

      // Log the container element for debugging
      //console.log(containerEle);

      if (containerEle) {
        // Initialize new map for each address with a slight delay
        setTimeout(() => initMap(lng, lat, mapContainer, coordinates, addressInfo, mapKey), 500 * Number(key.trim())); // Convert key to number for the delay
      } else {
        console.log(`Container for ${mapContainer} not found!`);
      }
    }
  }
}

// Call the function with addresses object



function initMap(lng, lat, mapContainer, coordinate, addressInfo, mapKey) {
  //document.querySelector('#calc-cc')?.classList.remove('is-green')

  const mapParentNode = document.querySelector(`#${mapContainer}`).parentNode
  const nextButton2nd = document.querySelector('[data-elem="2nd-next-button"]')
  const infoWrap = mapParentNode.querySelector('.info_wrap')
  const addressText = infoWrap.firstChild
  const searchedArea = infoWrap.lastChild
  const mapControlWrap = mapParentNode.querySelector('.map__info')
  const mapControlPrompt1 = mapControlWrap.querySelector('[data-button="prompt-1"]')
  const mapControlEdit = mapControlPrompt1.querySelector('[data-elem="adjust"]')
  // const mapControlProceed = mapControlPrompt1.lastChild
  // const mapControlPrompt2 = mapControlWrap.firstChild
  const mapControlReset = mapControlPrompt1.querySelector('[data-elem="reset-polygon"]')
  // const mapControlContinue = mapControlPrompt2.lastChild
  console.log(addressText, 'Adress Text Elem')
  addressText.textContent = addressInfo.address




  //Declaring Map instance with Token ID, Styles, Center and Zoom parameters

  // Create a new map.
  const map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/improveitmd/cl5jie1h3002814p935vxte0t',
    center: [lng, lat],
    zoom: 19,
    //maxZoom: 22,
    minZoom: 16

  });



  // Function to perform reverse geocoding using Mapbox Geocoding API
  function reverseGeocode(lat, lng, callback) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.features && data.features.length > 0) {
          const addressFull = extractAddressComponents(data)
          addressSearched[mapKey].address_info = addressFull
          const address = data.features[0].place_name;
          //console.log(data)
          callback(address);
        } else {
          callback('Address not found');
        }
      })
      .catch(error => {
        console.error('Error with reverse geocoding:', error);
        callback('Error retrieving address');
      });
  }

  // Calculate the centroid of a polygon
  function getCentroid(polygon) {
    let totalArea = 0;
    let centroidX = 0;
    let centroidY = 0;
    const points = polygon.geometry.coordinates[0];

    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];

      // Calculate the signed area of the trapezoid formed by the segment (x1, y1) to (x2, y2)
      const trapezoidArea = (x1 * y2 - x2 * y1);

      // Accumulate the signed area
      totalArea += trapezoidArea;

      // Accumulate the centroid X coordinate weighted by the area
      centroidX += (x1 + x2) * trapezoidArea;

      // Accumulate the centroid Y coordinate weighted by the area
      centroidY += (y1 + y2) * trapezoidArea;
    }

    // Calculate the total signed area of the polygon
    totalArea *= 0.5;

    // Calculate the centroid coordinates
    centroidX = centroidX / (6 * totalArea);
    centroidY = centroidY / (6 * totalArea);

    return { lat: centroidY, lng: centroidX };
  }

  // Method to get 1000 sq feet polygon data
  function bBox(param1) {
    // Convert LngLat to points in pixels
    const point = map.project(param1);

    // Declare value (height and width) for the polygon
    // Change this value if you want to adjust the size of the polygon
    const val = 83;

    // Calculate the points of the polygon in pixel coordinates
    const points = [
      [point.x - val, point.y + val],
      [point.x + val, point.y + val],
      [point.x + val, point.y - val],
      [point.x - val, point.y - val],
      [point.x - val, point.y + val] // Closing the polygon by repeating the first point
    ];

    // Convert points back to LngLat
    const coordinates = points.map(p => {
      const { lng, lat } = map.unproject(p);
      return [lng, lat];
    });

    // Declare a polygon JSON
    const polygon = {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [coordinates]
      },
      "properties": {
        "underground": "false",
        "extrude": "true",
        "height": 10,
        "iso_3166_2": "US-MD",
        "min_height": 0,
        "iso_3166_1": "US",
        "type": "building"
      },
      "id": 'new_polygon'
    };

    // Return the polygon in JSON format
    return polygon;
  }

  map.on('load', () => {
    //Setting a 50x50 pixels bounding box to detect the polygon on the address searched
    const point = map.project(coordinate);
    //You can change the value for width and height for more sensitivity
    const width = 50;
    const height = 50;

    let point1 = point.x - width / 2
    let point2 = point.y - height / 2
    let point3 = point.x + width / 2
    let point4 = point.y + height / 2
    let bbox = [[point1, point2], [point3, point4]]

    //Checking if we have any polygon in the bounding box
    const features = map.queryRenderedFeatures(bbox);
    //Getting polygon properties
    const displayProperties = { 'features': ['geometry', 'type', 'properties', 'id'], 'layer': '', 'sourceLayer': '' }
    //Mapping properties and checking if the feature is actually a building
    let newFeatures = [];
    for (let i = 0; i < features.length; i++) {
      if (features[i].layer.id === 'building') {
        newFeatures.splice(0, 0, features[i])

        i = features.length;

      }
    }
    //If we got any polygon then if block will execute which will create a polygon and disallowing additional clicks
    if (newFeatures.length !== 0) {
      const displayFeatures = newFeatures.map((feat) => {
        displayFeat = {};
        displayProperties.features.forEach((prop) => {
          displayFeat[prop] = feat[prop];

        }
        );

        draw.add(displayFeat);
        const data = draw.getAll();

        var modeOptions = {
          featureId: data.features[0].id
        }
        setTimeout(function () {
          draw.changeMode('static_mode', modeOptions)
        }, 1000)

        return displayFeat;

      }
      )
    }
    // Otherwise we will drop a polygon on the center and change the mode to edit it
    else {

      draw.add(bBox(coordinate))
      const data1 = draw.getAll();
      var modeOptions1 = {
        featureId: data1.features[0].id
      }

      setTimeout(function () {
        draw.changeMode('direct_select', modeOptions1)
      }, 1000)

    }

  });

  //Custom Blank Mode - For disallowing clicking on the polygons

  var static_mode = {};



  static_mode.onSetup = function (opts) {
    var state = {};
    state.count = opts.count || 0;
    return state;
  }

  static_mode.toDisplayFeatures = function (state, geojson, display) {
    display(geojson);
  }
    ;


  //Another Custom mode for drawing polygons - Create polygon on click


  var createPolygon = {};
  createPolygon.onSetup = function (opts) {
    var state = {};
    state.count = opts.count || 0;
    return state;
  }
    ;

  // Whenever a user clicks on the map, Draw will call `onClick`
  createPolygon.onClick = function (state, e) {
    // `this.newFeature` takes geojson and makes a DrawFeature
    const features = map.queryRenderedFeatures(e.point);
    // Limit the number of properties we're displaying for
    // legibility and performance
    const displayProperties = ['geometry', 'polygon', 'features', 'type', 'properties', 'id', 'layer', 'source', 'sourceLayer', 'state'];
    const displayFeatures = features.map((feat) => {
      displayFeat = {};
      displayProperties.forEach((prop) => {
        displayFeat[prop] = feat[prop];

      }
      );
      return displayFeat;

    }
    )

    var polygon = this.newFeature(displayFeat);
    this.addFeature(polygon);


  };
  // This is the same method but for Mobile
  createPolygon.onTap = function (state, e) {
    // `this.newFeature` takes geojson and makes a DrawFeature
    const features = map.queryRenderedFeatures(e.point);


    // Limit the number of properties we're displaying for
    // legibility and performance
    const displayProperties = ['geometry', 'polygon', 'features', 'type', 'properties', 'id', 'layer', 'source', 'sourceLayer', 'state'];
    const displayFeatures = features.map((feat) => {
      displayFeat = {};
      displayProperties.forEach((prop) => {
        displayFeat[prop] = feat[prop];

      }
      );
      return displayFeat;

    }
    )

    var polygon = this.newFeature(displayFeat);
    this.addFeature(polygon);


  };

  createPolygon.toDisplayFeatures = function (state, geojson, display) {
    display(geojson);
  }
    ;



  // Add the new draw mode to the MapboxDraw object
  // With custom styles
  var draw = new MapboxDraw({
    userProperties: true,
    styles: styles('#00F17F'),
    displayControlsDefault: false,

    defaultMode: 'lots_of_points',
    // Adds the createPolygon mode to the built-in set of modes and assign mode on map load
    modes: Object.assign({
      lots_of_points: createPolygon,
      static_mode: static_mode,
    }, MapboxDraw.modes),
  });
  map.addControl(draw);
  map.on('load', function () {
    draw.changeMode("lots_of_points");
    updateArea(searchedArea)
    

  });
  map.on('draw.update', function () {
    updateArea(searchedArea)
    updateAddress()
  })
  map.on('idle',function(){
    map.resize()
    })
  // draw.update(updateArea(searchedArea))

  //Method for getting and updating the area on page using Turf.js

  function updateArea(searchedAreaElem) {
    const data = draw.getAll();
    const area = turf.area(data);
    console.log(data, area, 'data', 'area')
    //Converting sq meters to sq feet
    var areaInFeet = area * 10.763911105;

    var rounded_area = Math.trunc(Math.round(areaInFeet * 100) / 100);

    searchedAreaElem.textContent = `${rounded_area.toLocaleString()} ft2`
    console.log(addressSearched, mapKey)
    addressSearched[mapKey].areaInFeet = rounded_area
    addressSearched[mapKey].areaInMeter = Math.trunc(Math.round(area * 100) / 100)

  }







  function mapEditMethod() {
    //Disabling Drag Pan controls
    //map.dragPan.disable();
    //Getting the drawn polygon data
    const data = draw.getAll();

    var modeOptions = {
      featureId: data.features[0].id
    }
    const polygonLength = data.features[0].geometry.coordinates[0]
    //Condition: if polygon has more than 35 corners then else block will execute - Otherwise we will change mode 
    // And select the polygon in editing mode
    if (polygonLength.length <= 35) {
      draw.changeMode('direct_select', modeOptions)
    } else {
      draw.deleteAll()
      draw.add(bBox(coordinate))
      const data = draw.getAll();
      var modeOptions = {
        featureId: data.features[0].id

      }
      //This will change the draw mode after 1 second
      setTimeout(function () { draw.changeMode('direct_select', modeOptions) }, 1000)
    }
  }




  function updateAddress() {
    //Getting the drawn polygon data
    var data = draw.getAll();

    // Example: getting the centroid of the first feature
    if (data.features.length > 0) {
      const centroid = getCentroid(data.features[0]);
      console.log(centroid)
      // Perform reverse geocoding
      reverseGeocode(centroid.lat, centroid.lng, function (address) {
        console.log('Current Address:', address);

        // Adding checks before accessing searchedArea and mapKey
        if (addressSearched && addressSearched[mapKey]) {
          addressSearched[mapKey].address = address;
          addressSearched[mapKey].coordinates = centroid;
          console.log(addressSearched, 'results')

        } else {
          console.error('searchedAddress or searchedAddress[mapKey] is undefined.');
        }

        //updating address on page
        if (addressText) {
          addressText.textContent = address;
        } else {
          console.error('addressText is undefined.');
        }

      });
    } else {
      console.log('No features found in the drawn data.');
    }
  }



  //Method to check if we have a poylgon drawn on the map if yes then switch the mode to Black/Static
  function checkPolygon() {
    let data = draw.getAll();
    let features = data.features
    console.log(features.length)
    if (features.length === 1) {

      draw.changeMode('static_mode')
      clearInterval(intervalFn)
    }
  }
  //Calling the above method on 200 ms until resolved
  const intervalFn = setInterval(checkPolygon, 200)




  function mapResetMethod() {

    //Deleting the existing polygon
    draw.deleteAll()
    //Drawing a 1000sq feet polygon on the address coordinates
    draw.add(bBox(coordinate))
    const data = draw.getAll();
    var modeOptions = {
      featureId: data.features[0].id

    }
    draw.changeMode("direct_select", modeOptions)


  }


  if (flowType === "multiple") {
    mapControlEdit?.addEventListener('click', mapEditMethod)
    mapControlReset?.addEventListener('click', mapResetMethod)
  } else {

    document?.querySelector('#editBtn').addEventListener('click', mapEditMethod)


    document?.querySelector('#continue')?.addEventListener('click', fourthScreen)
    document?.querySelector('#proceed')?.addEventListener('click', fourthScreen)
    //Reset button to delete all and drop a 1000 sq feet polygon on the center
    document?.querySelector('#resetBtn').addEventListener('click', mapResetMethod)
  }




  function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}



  function fourthScreen() {
    scrollToTop()
    //updateAddress()
    if (flowType === "single") {
      document.querySelector('[data-elem="size-wrap"]').classList.add('is--hidden')
      document.querySelector('[data-elem="material-wrap"]').classList.remove('is--hidden')
    } else {
      document.querySelector('[data-elem="multi-map-wrap"]').classList.add('is--hidden')
      document.querySelector('[data-elem="material-wrap"]').classList.remove('is--hidden')
    }
  }

  nextButton2nd?.addEventListener('click', fourthScreen)
}

// Global function for label color change animation
function changeLabelColor() {
  // Define selectors mapping for radio buttons and labels
  const elements = [
    { radio: '#asphalt', label: '#label-asphalt' },
    { radio: '#silicone', label: '#label-silicone' },
    { radio: '#tpo', label: '#label-tpo' },
    { radio: '#unsure', label: '#label-unsure' },
  ];

  elements.forEach(({ radio, label }) => {
    const $radio = $(radio);
    const $label = $(label);

    // Check if elements exist
    if ($radio.length === 0) {
      console.error(`Radio button with selector "${radio}" not found.`);
      return;
    }
    if ($label.length === 0) {
      console.error(`Label with selector "${label}" not found.`);
      return;
    }

    // Check if the radio button is checked
    const isChecked = $radio.siblings('.w-form-formradioinput').hasClass('w--redirected-checked');
    // Change label color based on the checked status
    $label.css('color', isChecked ? '#062640' : 'white');
  });
}
// Global interval setup for label color change

let materialSelected;

// Global function for setting up the calculator and storing the selection
function setupCalculatorAndStorage() {
  $("input[type='radio']").on("click", function () {
    const selectedRadio = $("input[name='material']:checked");
    if (selectedRadio.length === 0) {
      console.error("No radio button is selected.");
      return;
    }

    try {
      materialSelected = selectedRadio.val();
      console.log(materialSelected, 'materialSelected');


      const materialWrap = document.querySelector('[data-elem="material-wrap"]');
      const formWrap = document.querySelector('[data-elem="form-wrap"]');

      if (!materialWrap || !formWrap) {
        console.error("Required elements are not found in the DOM.");
        return;
      }

      materialWrap.classList.add('is--hidden');
      formWrap.classList.remove('is--hidden');
    } catch (error) {
      console.error("An error occurred while setting up the calculator and storage:", error);
    }
  });
}

setTimeout(setupCalculatorAndStorage, 2000)


// Constants
const SQ_FEET_CONVERSION_FACTOR = 10.763911105;
const SLOP_WASTE_FACTOR = 1.10;
const FLAT_SLOP_WASTE_FACTOR = 1;
const WASTE_MULTIPLIER = 0.10;
const EXTRA_CHARGE = 1000;

// Single Pricing Factor
const priceFactors = {
  Asphalt: [5.00, 7.50],
  Silicone: [10, 17],
  TPO: [12, 19],
  Standard: [5.00, 7.50]
};

// Helper functions
function calculateSquareFeet(area) {
  return Math.round(parseInt(area) * SQ_FEET_CONVERSION_FACTOR);
}

function calculateMaterialCalc(sqFoot, factor, multiplier) {
  console.log(sqFoot, factor, multiplier, 'sqFoot, factor, multiplier')
  return ((sqFoot * factor) * multiplier) + (sqFoot * factor);
}

function calculatePrice(calc, lowRate, highRate, additionalCost = 0) {
  console.log(calc, lowRate, highRate, 'calc lowrate, highrate')
  return {
    lowPrice: calc * lowRate + additionalCost,
    highPrice: calc * highRate + additionalCost
  };
}

function calculateMaterialPrice(materialCalc, materialRates) {
  if (materialRates && materialRates.length === 2) {
    return calculatePrice(materialCalc, ...materialRates);
  }
  console.error("Rates for material are not defined.");
  return { lowPrice: 0, highPrice: 0 };
}

// Function for calculating and storing pricing information
function updateSearchedAddressesWithPricing() {
  Object.keys(addressSearched).forEach(key => {
    const addressData = addressSearched[key];
    const sqFoot = Number(addressData.areaInFeet);

    let materialCalc;
    switch (materialSelected) {
      case 'Asphalt':
        materialCalc = calculateMaterialCalc(sqFoot, SLOP_WASTE_FACTOR, WASTE_MULTIPLIER);
        break;
      case 'Silicone':
        materialCalc = calculateMaterialCalc(sqFoot, SLOP_WASTE_FACTOR, WASTE_MULTIPLIER);
        break;
      case 'TPO':
        materialCalc = calculateMaterialCalc(sqFoot, FLAT_SLOP_WASTE_FACTOR, WASTE_MULTIPLIER);
        break;
      case 'Standard':
        materialCalc = calculateMaterialCalc(sqFoot, SLOP_WASTE_FACTOR, WASTE_MULTIPLIER);
        break;
      default:
        console.error("Unknown material selected.");
        return;
    }

    // Calculate prices
    const materialRates = priceFactors[materialSelected];
    let materialPrice = calculateMaterialPrice(materialCalc, materialRates);

    // Extra charge for areas less than 1000 sq feet
    if (sqFoot <= 1000) {
      materialPrice = calculatePrice(materialCalc, ...materialRates, EXTRA_CHARGE);
    }

    console.log(`${sqFoot} sqft`, `${materialSelected} Price: ${materialPrice.lowPrice} - ${materialPrice.highPrice}`);

    // Storing prices back in the searchedAddress object
    addressSearched[key].lowPrice = materialPrice.lowPrice;
    addressSearched[key].highPrice = materialPrice.highPrice;
  });
}

// Main function for setting up the calculator and storing the selection
function setupCalculatorAndStorage() {
  $("input[type='radio']").on("click", function () {
    const selectedRadio = $("input[name='material']:checked");
    if (selectedRadio.length === 0) {
      console.error("No radio button is selected.");
      return;
    }

    try {
      materialSelected = selectedRadio.val();
      console.log(materialSelected, 'materialSelected');

      // Calculate and update pricing information
      updateSearchedAddressesWithPricing();

 

      const materialWrap = document.querySelector('[data-elem="material-wrap"]');
      const formWrap = document.querySelector('[data-elem="form-wrap"]');

      if (!materialWrap || !formWrap) {
        console.error("Required elements are not found in the DOM.");
        return;
      }

      materialWrap.classList.add('is--hidden');
      formWrap.classList.remove('is--hidden');
    } catch (error) {
      console.error("An error occurred while setting up the calculator and storage:", error);
    }
  });
}










if (typeof apiKey === 'undefined') {
  window.apiKey = 'bdc_7a3c280817af44a2952336e349e70525';
}
// Asynchronous function to validate phone number
async function validatePhoneNumber(phone) {
  // var phone = document.getElementById(phoneFieldId).value;

  // Construct the API endpoint URL
  const apiUrl = `https://api-bdc.net/data/phone-number-validate?number=${encodeURIComponent(phone)}&countryCode=us&localityLanguage=en&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log(data)
    return data.isValid; // Returns true if valid, false otherwise
  } catch (error) {
    console.error('Error:', error);
    return false; // Assume invalid on error
  }
}


function generateUniqueCode() {
  let code = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}
var uniqueId = generateUniqueCode()
console.log(uniqueId)



  
function handleSubmitForm(formAttribute, nameFieldAttribute, phoneFieldAttribute) {
  var formWrapper = document.querySelectorAll(formAttribute);
 formWrapper.forEach(formDiv => {
  var form = formDiv.querySelector('form')
  
  form.addEventListener("submit", submitMethod)
 })
    
    async  function submitMethod(e) {
    const damageStatus = document.querySelector('input[type=hidden]').value
    e.preventDefault(); // Prevent default form submission
    var maskedPhone = document.querySelector(phoneFieldAttribute).value;
    var extractedPhone = maskedPhone.replace(/\D/g, '');

      const isValidPhoneNumber = await validatePhoneNumber(extractedPhone);
      if (isValidPhoneNumber) {
        console.log("Phone number is valid, proceeding with form submission.");
        initResults();
        document.querySelector('[data-elem="form-wrap"]').classList.add('is--hidden')
        document.querySelector('[data-elem="results-wrap-multi"]').classList.remove('is--hidden')

        var name = document.querySelector(nameFieldAttribute).value;
        var phone = maskedPhone


        document.querySelector(formAttribute).value = uniqueId
        let area_ft = 0;
        let area_mt = 0;

        // ToDo change this accordingly
        var formdata = new FormData();
        formdata.append("name", name);
        Object.keys(addressSearched).forEach(key => {
          const addressData = addressSearched[key]
          formdata.append(`address_${key}`, addressData.address);
          console.log(`Area in Feet: ${addressData.areaInFeet}, Area in Meters: ${addressData.areaInMeter}`);
          area_ft += Number(addressData.areaInFeet);
          area_mt += Number(addressData.areaInMeter);



        })
        console.log(`Total Area in Feet: ${area_ft}, Total Area in Meters: ${area_mt}`);

        formdata.append(`total_area_ft`, formatString(area_ft));
        formdata.append(`total_area_mt`, area_mt.toFixed(1));
        formdata.append("phone", phone);
        formdata.append("storm_damage", damageStatus);
        formdata.append("selected_material", materialSelected);
        formdata.append("id", uniqueId)

        var requestOptions = {
          method: "POST",
          body: formdata,
          redirect: "follow",
        };

        fetch(
          "https://script.google.com/macros/s/AKfycbx0a9OwBd6vSqZ7VHvuXTalPp-COSHMPmjfkh4E2toPLvXBf8fi-UUlrOTHSTi6aoht/exec",
          requestOptions
        )
          .then((response) => response.text())
          .then((result) => console.log(result))
          .catch((error) => console.log("error", error))
      } else {
        console.log("Phone number is not valid. Form submission prevented.");
        alert('Phone number is not valid.'); // Show an alert instead of custom validity
        document.querySelector(phoneFieldId).value = ''; // Clear the phone field




      }




    }
  }
  // Attaching event listeners to forms
  handleSubmitForm('[data-form="commercial"]', '[data-elem="name"]', '[data-elem="phone"]')






// Function to initialize and populate results
function initResults() {

  const price_tag = document.querySelector('[data-elem="material-selected"]')

  if (materialSelected === "Silicone") {
    
    price_tag.textContent = "Silicone Roof Coating";
  } else if (materialSelected === "TPO") {
    price_tag.textContent = "TPO Flat Roofing";

  } else if (materialSelected === "Standard") {
    price_tag.textContent = "Standard Roofing";

  }  else if (materialSelected === "Asphalt") {
    price_tag.textContent = "Asphalt Roofing";

  }

  const addressWrapTemplate = document.querySelector('[data-elem="address-pricing-wrap"]');
  const addressWrapParent = addressWrapTemplate.parentNode;

  // Remove the template from the DOM to avoid duplication
  addressWrapTemplate.remove();

  // Iterate over the addresses in addressSearched
  Object.keys(addressSearched).forEach(key => {
    const addressData = addressSearched[key];

    // Clone the template
    const addressWrapClone = addressWrapTemplate.cloneNode(true);

    // Populate the clone with address data
    addressWrapClone.querySelector('[data-elem="results-address"]').textContent = addressData.address;
    addressWrapClone.querySelector('[data-elem="lowPrice"]').textContent = formatString((addressData.lowPrice).toFixed(0));
    addressWrapClone.querySelector('[data-elem="highPrice"]').textContent = formatString((addressData.highPrice).toFixed(0));

    // Optionally, populate additional fields if needed
    // addressWrapClone.querySelector('[data-elem="short-address"]').textContent = addressData.address_info.short_address;
    // addressWrapClone.querySelector('[data-elem="city"]').textContent = addressData.address_info.city;
    // addressWrapClone.querySelector('[data-elem="state"]').textContent = addressData.address_info.state;
    // addressWrapClone.querySelector('[data-elem="zip"]').textContent = addressData.address_info.zip;

    // Append the populated clone to the parent node
    addressWrapParent.appendChild(addressWrapClone);
  });

  setupFormSubmission();

}

//Method to display prices with a comma after thousands
function formatString(x) {
  // x.toFixed(0)
  if (x) {

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}



  // Function to show success message
  function showSuccessMessage(form) {
    document.querySelector('[data-block="2nd-form-success"]').classList.remove('is--hidden');
    document.querySelector('[data-field="second-form-block"]').style.display = 'none'; // Hide the form
  }
  
  // Function to send data to your server
  function sendDataToGoogleSheets(data, form) {
  
    var formData = new FormData();
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, data[key]);
      }
    }
  
    var requestOptions = {
      method: "POST",
      body: formData,
      redirect: "follow",
    };
  
    fetch("https://script.google.com/macros/s/AKfycbzyfGncBzCinWRlAM6ji5otrANDvW5DuuZ0bGuHCaVmn4Nl45VMh0I1yF8z3DtAbx7nsw/exec", requestOptions)
      .then((response) => {
        if (response.ok) {
          
        } else {
          throw new Error("Server response wasn't OK");
        }
        return response.text();
      })
      .then((result) => console.log(result))
      .catch((error) => {
        console.log("error", error);
      });
  }
  
  // Function to map form data to your row headers
  function mapFormDataToRowHeaders(formData) {
    console.log(formData);
    let mappedData = {
      name: formData["name"],
      phone: formData["phone"],
      id: formData["id"]
    };
    return mappedData;
  }
  
  // Function to collect data from a form
  function collectFormData(form) {
    let formData = {};
    // Capture the form's data-name attribute
    let formName = form.getAttribute("data-name");
    formData["form_name"] = formName;
    form.querySelectorAll("[data-field]").forEach(function (element) {
      let name = element.getAttribute("data-field");
      let value = element.value;
      formData[name] = value;
    });
  
    return formData;
  }
  
  function setupFormSubmission() {
    // Attach event listener to the specific form for submit events
    var form = document.querySelector("[data-field='second-form']");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const formName = form.getAttribute("data-name");
        const formElement = form;
        // setting up tracking here
  
        let formData = collectFormData(this);
        let dataToSend = mapFormDataToRowHeaders(formData);
        // Verify email before proceeding
        if (formData && dataToSend){
          showSuccessMessage(form);
        } 
  
        // Email is valid, proceed with form submission
        
        dataToSend["id"] = uniqueId;
        sendDataToGoogleSheets(dataToSend, formElement);
      });
    }
  }
  