/**
 * @license
 * Copyright 2021 Justin Braaten
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #############################################################################
// ### IMPORT MODULES ###
// #############################################################################

// RGB time series charting module: https://github.com/jdbcode/ee-rgb-timeseries
var rgbTs = require(
  'users/jstnbraaten/modules:rgb-timeseries/rgb-timeseries.js'); 

// Landsat collection builder module: https://jdbcode.github.io/EE-LCB/
var lcb = require('users/jstnbraaten/modules:ee-lcb.js');  


// #############################################################################
// ### GET URL PARAMS ###
// #############################################################################

var initRun = 'false';
var runUrl = ui.url.get('run', initRun);
ui.url.set('run', runUrl);

var initSensor = 'Sentinel-2 SR';
var sensorUrl = ui.url.get('sensor', initSensor);
ui.url.set('sensor', sensorUrl);

var initLon = -121.68804;
var lonUrl = ui.url.get('lon', initLon);
ui.url.set('lon', lonUrl);

var initLat = 36.46517;
var latUrl = ui.url.get('lat', initLat);
ui.url.set('lat', latUrl);

var initIndex = 'NBR';
var indexUrl = ui.url.get('index', initIndex);
ui.url.set('index', indexUrl);

var initRgb = 'SWIR1/NIR/GREEN';
var rgbUrl = ui.url.get('rgb', initRgb);
ui.url.set('rgb', rgbUrl);

var initDuration = 12;
var durationUrl = ui.url.get('duration', initDuration);
ui.url.set('duration', durationUrl);

var initCloud = 30;
var cloudUrl = ui.url.get('cloud', initCloud);
ui.url.set('cloud', cloudUrl);

var initChipWidth = 2;
var chipWidthUrl = ui.url.get('chipwidth', initChipWidth);
ui.url.set('chipwidth', chipWidthUrl);



// #############################################################################
// ### DEFINE UI ELEMENTS ###
// #############################################################################

// Style.
var CONTROL_PANEL_WIDTH = '280px';
var CONTROL_PANEL_WIDTH_HIDE = '145px';
var textFont = {fontSize: '12px'};
var headerFont = {
  fontSize: '13px', fontWeight: 'bold', margin: '4px 8px 0px 8px'};
var sectionFont = {
  fontSize: '16px', color: '#808080', margin: '16px 8px 0px 8px'};
var infoFont = {fontSize: '11px', color: '#505050'};

// Control panel.
var controlPanel = ui.Panel({
  style: {position: 'top-left', width: CONTROL_PANEL_WIDTH_HIDE,
    maxHeight: '90%'
  }});

// Info panel.
var infoElements = ui.Panel(
  {style: {shown: false, margin: '0px -8px 0px -8px'}});

// Element panel.
var controlElements = ui.Panel(
  {style: {shown: false, margin: '0px -8px 0px -8px'}});

// Instruction panel.
var instr = ui.Label('Click on a location',
  {fontSize: '15px', color: '#303030', margin: '0px 0px 6px 0px'});

// Show/hide info panel button.
var infoButton = ui.Button(
  {label: 'About ❯', style: {margin: '0px 4px 0px 0px'}});

// Show/hide control panel button.
var controlButton = ui.Button(
  {label: 'Options ❯', style: {margin: '0px 0px 0px 0px'}});

// Info/control button panel.
var buttonPanel = ui.Panel(
  [infoButton, controlButton],
  ui.Panel.Layout.Flow('horizontal'),
  {stretch: 'horizontal', margin: '0px 0px 0px 0px'});

// Options label.
var optionsLabel = ui.Label('Options', sectionFont);
optionsLabel.style().set('margin', '16px 8px 2px 8px');

// Information label.
var infoLabel = ui.Label('About', sectionFont);

// Information text. 
var aboutLabel = ui.Label(
  'This app shows a time series chart and image chips for selected ' +
  'datasets and locations for images collected within two years of today. Time series ' +
  'point colors are defined by RGB assignment to selected bands where ' +
  'intensity is based on the area-weighted mean pixel value within a radius ' +
  'around the clicked point in the map (30 m for Sentinel-2, 45 m for Landsat-8).',
  infoFont);

var appCodeLink = ui.Label({
  value: 'Work in progress, stay tuned for updates',
  style: {fontSize: '11px', color: '#505050', margin: '-4px 8px 0px 8px'}, 
  //targetUrl: 'https://github.com/jdbcode/ee-rgb-timeseries/blob/main/landsat-timeseries-explorer.js'
});



// Sensor selection.
var sensorLabel = ui.Label({value: 'Sensor selection', style: headerFont});
var sensorList = ['Sentinel-2 SR', 'Sentinel-2 TOA',
                  'Landsat-8 SR', 'Landsat-8 TOA'];
var sensorSelect = ui.Select({
  items: sensorList, placeholder: ui.url.get('sensor'),
  value: ui.url.get('sensor'), style: {stretch: 'horizontal'}
});
var sensorPanel = ui.Panel([sensorLabel, sensorSelect], null, {stretch: 'horizontal'});

// Y-axis index selection.
var indexLabel = ui.Label('Y-axis index', headerFont);
var indexList = ['NBR', 'NDVI', 'Blue', 'Green', 'Red',
                 'NIR', 'SWIR1', 'SWIR2'];
var indexSelect = ui.Select(
  {items: indexList, value: ui.url.get('index'), style: {stretch: 'horizontal'}});
var indexPanel = ui.Panel(
  [indexLabel, indexSelect], null, {stretch: 'horizontal'});

// RGB bands selection.
var rgbLabel = ui.Label({value: 'RGB visualization', style: headerFont});
var rgbList = ['SWIR1/NIR/GREEN', 'RED/GREEN/BLUE', 'NIR/RED/GREEN',
               'NIR/SWIR1/RED'];
var rgbSelect = ui.Select({
  items: rgbList, placeholder: ui.url.get('rgb'),
  value: ui.url.get('rgb'), style: {stretch: 'horizontal'}
});
var rgbPanel = ui.Panel([rgbLabel, rgbSelect], null, {stretch: 'horizontal'});

// Duration.
var durationLabel = ui.Label(
  {value: 'Duration (months prior)', style: headerFont});
var durationSlider = ui.Slider({
  min: 1, max: 24 , value: parseInt(ui.url.get('duration')),
  step: 1, style: {stretch: 'horizontal'}
});
var durationPanel = ui.Panel(
  [durationLabel, durationSlider], null, {stretch: 'horizontal'});

// Cloud threshold.
var cloudLabel = ui.Label(
  {value: 'Cloud threshold % (exclude >)', style: headerFont});
var cloudSlider = ui.Slider({
  min: 0, max: 100 , value: parseInt(ui.url.get('cloud')),
  step: 1, style: {stretch: 'horizontal'}
});
var cloudPanel = ui.Panel(
  [cloudLabel, cloudSlider], null, {stretch: 'horizontal'});

// Region buffer.
var regionWidthLabel = ui.Label(
  {value: 'Image chip width (km)', style: headerFont});
var regionWidthSlider = ui.Slider({
  min: 1, max: 10 , value: parseInt(ui.url.get('chipwidth')),
  step: 1, style: {stretch: 'horizontal'}
});
var regionWidthPanel = ui.Panel(
  [regionWidthLabel, regionWidthSlider], null, {stretch: 'horizontal'});

// A message to wait for image chips to load.
var waitMsgImgPanel = ui.Label({
  value: '⚙️' + ' Processing, please wait.',
  style: {
    stretch: 'horizontal',
    textAlign: 'center',
    backgroundColor: '#d3d3d3'
  }
});

// Panel to hold the chart.
var chartPanel = ui.Panel({style: {height: '25%'}});

// Holder for image cards.
var imgCardPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal', true),
  style: {width: '897px', backgroundColor: '#d3d3d3'}
});

// Map widget.
var map = ui.Map();

// Map/chart panel
var mapChartSplitPanel = ui.Panel(ui.SplitPanel({
  firstPanel: map, //
  secondPanel: chartPanel,
  orientation: 'vertical',
  wipe: false,
}));

// Map/chart and image card panel
var splitPanel = ui.SplitPanel(mapChartSplitPanel, imgCardPanel);

// Submit changes button.
var submitButton = ui.Button({
  label: 'Submit changes',
  style: {stretch: 'horizontal', shown: false}
});



// #############################################################################
// ### DEFINE INITIALIZING CONSTANTS ###
// #############################################################################

// Set color of the circle to show on map and images where clicked
var AOI_COLOR = 'ffffff';  //'b300b3';

var COORDS = null;
var CLICKED = false;

// Set region reduction and chart params.
var OPTIONAL_PARAMS = {
  reducer: ee.Reducer.mean(),
  scale: 20,
  crs: 'EPSG:4326',
  chartParams: {
    pointSize: 11,
    legend: {position: 'none'},
    hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
    vAxis: {
      title: indexSelect.getValue(),
      titleTextStyle: {italic: false, bold: true}
    },
    explorer: {axis: 'horizontal'}
  }
};

var sensorInfo = {
  'Landsat-8 SR': {
    id: 'LANDSAT/LC08/C01/T1_SR',
    scale: 30,
    index: {
      NBR: 'NBR',
      NDVI: 'NDVI',
      Blue: 'B2',
      Green: 'B3',
      Red: 'B4',
      NIR: 'B5',
      SWIR1: 'B6',
      SWIR2: 'B7'
    },
    rgb: {
      'SWIR1/NIR/GREEN': {
        bands: ['B6', 'B5', 'B3'],
        min: [100, 151 , 50],
        max: [4500, 4951, 2500],
        gamma: [1, 1, 1]
      },
      'RED/GREEN/BLUE': {
        bands: ['B4', 'B3', 'B2'],
        min: [0, 50, 50],
        max: [2500, 2500, 2500],
        gamma: [1.2, 1.2, 1.2]
      },
      'NIR/RED/GREEN': {
        bands: ['B5', 'B4', 'B3'],
        min: [151, 0, 50],
        max: [4951, 2500, 2500],
        gamma: [1, 1, 1]
      },
      'NIR/SWIR1/RED': {
        bands: ['B5', 'B6', 'B3'],
        min: [151, 100, 50],
        max: [4951, 4500, 2500],
        gamma: [1, 1, 1]
      }      
    }
  },
  'Landsat-8 TOA': {
    id: 'LANDSAT/LC08/C01/T1_TOA',
    scale: 30,
    index: {
      NBR: 'NBR',
      NDVI: 'NDVI',
      Blue: 'B2',
      Green: 'B3',
      Red: 'B4',
      NIR: 'B5',
      SWIR1: 'B6',
      SWIR2: 'B7'
    },
    rgb: {
      'SWIR1/NIR/GREEN': {
        bands: ['B6', 'B5', 'B3'],
        min: [0.0100, 0.0151 , 0.0050],
        max: [0.4500, 0.4951, 0.2500],
        gamma: [1, 1, 1]
      },
      'RED/GREEN/BLUE': {
        bands: ['B4', 'B3', 'B2'],
        min: [0, 0.0050, 0.0050],
        max: [0.2500, 0.2500, 0.2500],
        gamma: [1.2, 1.2, 1.2]
      },
      'NIR/RED/GREEN': {
        bands: ['B5', 'B4', 'B3'],
        min: [0.0151, 0, 0.0050],
        max: [0.4951, 0.2500, 0.2500],
        gamma: [1, 1, 1]
      },
      'NIR/SWIR1/RED': {
        bands: ['B5', 'B6', 'B3'],
        min: [0.0151, 0.0100, 0.0050],
        max: [0.4951, 0.4500, 0.2500],
        gamma: [1, 1, 1]
      }      
    }
  },
  'Sentinel-2 SR': {
    id: 'COPERNICUS/S2_SR',
    scale: 20,
    index: {
      NBR: 'NBR',
      NDVI: 'NDVI',
      Blue: 'B2',
      Green: 'B3',
      Red: 'B4',
      NIR: 'B8',
      SWIR1: 'B11',
      SWIR2: 'B12'
    },
    rgb: {
      'SWIR1/NIR/GREEN': {
        bands: ['B11', 'B8', 'B3'],
        min: [100, 151 , 50],
        max: [4500, 4951, 2500],
        gamma: [1, 1, 1]
      },
      'RED/GREEN/BLUE': {
        bands: ['B4', 'B3', 'B2'],
        min: [0, 50, 50],
        max: [2500, 2500, 2500],
        gamma: [1.2, 1.2, 1.2]
      },
      'NIR/RED/GREEN': {
        bands: ['B8', 'B4', 'B3'],
        min: [151, 0, 50],
        max: [4951, 2500, 2500],
        gamma: [1, 1, 1]
      },
      'NIR/SWIR1/RED': {
        bands: ['B8', 'B11', 'B3'],
        min: [151, 100, 50],
        max: [4951, 4500, 2500],
        gamma: [1, 1, 1]
      }      
    }
  },
  'Sentinel-2 TOA': {
    id: 'COPERNICUS/S2',
    scale: 20,
    index: {
      NBR: 'NBR',
      NDVI: 'NDVI',
      Blue: 'B2',
      Green: 'B3',
      Red: 'B4',
      NIR: 'B8',
      SWIR1: 'B11',
      SWIR2: 'B12'
    },
    rgb: {
      'SWIR1/NIR/GREEN': {
        bands: ['B11', 'B8', 'B3'],
        min: [100, 151 , 50],
        max: [4500, 4951, 2500],
        gamma: [1, 1, 1]
      },
      'RED/GREEN/BLUE': {
        bands: ['B4', 'B3', 'B2'],
        min: [0, 50, 50],
        max: [2500, 2500, 2500],
        gamma: [1.2, 1.2, 1.2]
      },
      'NIR/RED/GREEN': {
        bands: ['B8', 'B4', 'B3'],
        min: [151, 0, 50],
        max: [4951, 2500, 2500],
        gamma: [1, 1, 1]
      },
      'NIR/SWIR1/RED': {
        bands: ['B8', 'B11', 'B3'],
        min: [151, 100, 50],
        max: [4951, 4500, 2500],
        gamma: [1, 1, 1]
      }      
    }    
  }
};



// #############################################################################
// ### DEFINE FUNCTIONS ###
// #############################################################################

// /**
// * Cloud mask Landsat images.
// */
// function fmask(img) {
//   var cloudShadowBitMask = 1 << 3;
//   var cloudsBitMask = 1 << 5;
//   var qa = img.select('pixel_qa');
//   var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
//     .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
//   return img.updateMask(mask);
// }

/**
 * Selects and renames bands of interest for TM/ETM+.
 */
function renameEtm(img) {
  return img.select(
    ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'],
    ['B2', 'B3', 'B4', 'B5', 'B6', 'B7']);
}

/**
 * Ccloud masks OLI images.
 */
function prepOli(img) {
  //img = fmask(img);
 return addDate(addBandsLandsat(img));
}

/**
 * Prepares (cloud masks and renames) TM/ETM+ images.
 */
function prepEtm(img) {
  //img = fmask(img);
  return addDate(addBandsLandsat(renameEtm(img)));
}

/**
 * Add NDVI band Landsat.
 */
function addBandsLandsat(img) {
  var nbr = img.normalizedDifference(['B5', 'B7']).rename(['NBR']);
  var ndvi = img.normalizedDifference(['B5', 'B4']).rename('NDVI');
  return img.addBands(ee.Image.cat(nbr, ndvi));
}

/**
 * Add NDVI band Sentinel-2.
 */
function addBandsS2(img) {
  var nbr = img.normalizedDifference(['B8', 'B12']).rename(['NBR']);
  var ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return img.addBands(ee.Image.cat(nbr, ndvi));
}

/**
 * Add date property.
 */
function addDate(img) {
  var date = img.date().format('YYYY-MM-dd');
  return img.set('date', date);
}

/**
 * Gathers all Landsat into a collection.
 */
function getLandsatCollection(aoi, startDate, endDate, cloudthresh, id) {
  var oliCol = ee.ImageCollection(id)
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', cloudthresh))
    .map(prepOli);
    
  return oliCol;
}

/**
 * Join S2 SR and S2 cloudless.
 */
function getS2SrCldCol(aoi, startDate, endDate, cloudthresh, id) {
  var s2SrCol = ee.ImageCollection(id)
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudthresh));

  return s2SrCol.map(addBandsS2).map(addDate);
}

/**
 * Clears image cards from the image card panel.
 */
function clearImgs() {
  imgCardPanel.clear();
}

/**
 * Displays image cards to the card panel.
 */
function displayBrowseImg(col, aoiBox, aoiCircle) {
  clearImgs();
  waitMsgImgPanel.style().set('shown', true);
  imgCardPanel.add(waitMsgImgPanel);

  var visParams = sensorInfo[sensorSelect.getValue()]['rgb'][rgbSelect.getValue()];
  
  var dates = col.aggregate_array('date').sort();
  
  dates.evaluate(function(dates) {
    waitMsgImgPanel.style().set('shown', false);
    dates.forEach(function(date) {
      var img = col.filter(ee.Filter.eq('date', date)).first();
      
      var aoiImg = ee.Image().byte()
        .paint(ee.FeatureCollection(ee.Feature(aoiCircle)), 1, 2)
        .visualize({palette: AOI_COLOR});
      
      var thumbnail = ui.Thumbnail({
        image: img.visualize(visParams).blend(aoiImg),
        params: {
          region: aoiBox,
          dimensions: '200',
          crs: 'EPSG:3857',
          format: 'PNG'
        }
      });
      
      var imgCard = ui.Panel([
        ui.Label(date,
          {margin: '4px 4px -6px 8px', fontSize: '13px', fontWeight: 'bold'}),
        thumbnail
      ], null, {margin: '4px 0px 0px 4px' , width: 'px'});
      
      imgCardPanel.add(imgCard);
    });
  });
}

/**
 * Generates chart and adds image cards to the image panel.
 */
function renderGraphics(coords) {
  // Get the selected RGB combo vis params.
  var visParams = sensorInfo[sensorSelect.getValue()]['rgb'][rgbSelect.getValue()];
  
  // Get the clicked point and buffer it.
  var point = ee.Geometry.Point(coords);
  var aoiCircle = point.buffer(45);
  var aoiBox = point.buffer(regionWidthSlider.getValue()*1000/2);
  
  // Clear previous point from the Map.
  map.layers().forEach(function(el) {
    map.layers().remove(el);
  });

  // Add new point to the Map.
  map.addLayer(aoiCircle, {color: AOI_COLOR});
  map.centerObject(aoiCircle, 14);

  // Get collection options.
  var sensor = sensorSelect.getValue();
  var cloudThresh = cloudSlider.getValue();
  var datasetId = sensorInfo[sensor]['id'];
  var endDate = new Date();
  var startDate = ee.Date(endDate)
    .advance(-parseInt(durationSlider.getValue()), 'months');

  // Build the collection.
  var col;
  if(sensor == 'Sentinel-2 SR' | sensor == 'Sentinel-2 TOA') {
    col = getS2SrCldCol(aoiBox, startDate, endDate, cloudThresh, datasetId);
  } else if(sensor == 'Landsat-8 SR' | sensor == 'Landsat-8 TOA') {
    col = getLandsatCollection(aoiBox, startDate, endDate, cloudThresh, datasetId);
  }

  col = ee.ImageCollection(col.distinct('date')).sort('system:time_start');

  // Display the image chip time series. 
  displayBrowseImg(col, aoiBox, aoiCircle);

  OPTIONAL_PARAMS['chartParams']['vAxis']['title'] = indexSelect.getValue();
  OPTIONAL_PARAMS['scale'] = sensorInfo[sensorSelect.getValue()]['scale'];

  // Render the time series chart.
  rgbTs.rgbTimeSeriesChart(col, aoiCircle,
    sensorInfo[sensorSelect.getValue()]['index'][indexSelect.getValue()],
    sensorInfo[sensorSelect.getValue()]['rgb'][rgbSelect.getValue()],
    chartPanel, OPTIONAL_PARAMS);
}

/**
 * Handles map clicks.
 */
function handleMapClick(coords) {
  CLICKED = true;
  COORDS = [coords.lon, coords.lat];
  ui.url.set('run', 'true');
  ui.url.set('lon', COORDS[0]);
  ui.url.set('lat', COORDS[1]);
  renderGraphics(COORDS);
}

/**
 * Handles submit button click.
 */
function handleSubmitClick() {
  renderGraphics(COORDS);
  submitButton.style().set('shown', false);
}

/**
 * Sets URL params.
 */
function setParams() {
  ui.url.set('sensor', sensorSelect.getValue());
  ui.url.set('index', indexSelect.getValue());
  ui.url.set('rgb', rgbSelect.getValue());
  ui.url.set('duration', durationSlider.getValue());
  ui.url.set('cloud', cloudSlider.getValue());
  ui.url.set('chipwidth', regionWidthSlider.getValue());
}   
  
/**
 * Show/hide the submit button.
 */
function showSubmitButton() {
  if(CLICKED) {
    submitButton.style().set('shown', true);
  }
}

/**
 * Handles options changes.
 */
function optionChange() {
  showSubmitButton();
  setParams();
}

/**
 * Show/hide the control panel.
 */
var controlShow = false;
function controlButtonHandler() {
  if(controlShow) {
    controlShow = false;
    controlElements.style().set('shown', false);
    controlButton.setLabel('Options ❯');
  } else {
    controlShow = true;
    controlElements.style().set('shown', true);
    controlButton.setLabel('Options ❮');
  }
  
  if(infoShow | controlShow) {
    controlPanel.style().set('width', CONTROL_PANEL_WIDTH);
  } else {
    controlPanel.style().set('width', CONTROL_PANEL_WIDTH_HIDE);
  }
}

/**
 * Show/hide the control panel.
 */
var infoShow = false;
function infoButtonHandler() {
  if(infoShow) {
    infoShow = false;
    infoElements.style().set('shown', false);
    infoButton.setLabel('About ❯');
  } else {
    infoShow = true;
    infoElements.style().set('shown', true);
    infoButton.setLabel('About ❮');
  }
  
  if(infoShow | controlShow) {
    controlPanel.style().set('width', CONTROL_PANEL_WIDTH);
  } else {
    controlPanel.style().set('width', CONTROL_PANEL_WIDTH_HIDE);
  }
}



// #############################################################################
// ### SETUP UI ELEMENTS ###
// #############################################################################

infoElements.add(infoLabel);
infoElements.add(aboutLabel);
infoElements.add(appCodeLink);

controlElements.add(optionsLabel);
controlElements.add(sensorPanel);
controlElements.add(indexPanel);
controlElements.add(rgbPanel);
controlElements.add(durationPanel);
controlElements.add(cloudPanel);
controlElements.add(regionWidthPanel);
controlElements.add(submitButton);

controlPanel.add(instr);
controlPanel.add(buttonPanel);
controlPanel.add(infoElements);
controlPanel.add(controlElements);

map.add(controlPanel);

infoButton.onClick(infoButtonHandler);
controlButton.onClick(controlButtonHandler);
sensorSelect.onChange(optionChange);
rgbSelect.onChange(optionChange);
indexSelect.onChange(optionChange);
durationSlider.onChange(optionChange);
cloudSlider.onChange(optionChange);
regionWidthSlider.onChange(optionChange);
submitButton.onClick(handleSubmitClick);
map.onClick(handleMapClick);

map.style().set('cursor', 'crosshair');
map.setOptions('SATELLITE');
map.setControlVisibility(
  {layerList: false, fullscreenControl: false, zoomControl: false});
//map.centerObject(ee.Geometry.Point([-122.91966, 44.24135]), 14);

ui.root.clear();
ui.root.add(splitPanel);


if(ui.url.get('run')) {
  CLICKED = true;
  COORDS = [ui.url.get('lon'), ui.url.get('lat')];
  renderGraphics(COORDS);
}
