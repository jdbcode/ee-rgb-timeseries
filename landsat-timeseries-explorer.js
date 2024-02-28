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
// var lcb = require('users/jstnbraaten/modules:ee-lcb.js');  
var lsc = require('users/jstnbraaten/modules:ls-composites');

// #############################################################################
// ### GET URL PARAMS ###
// #############################################################################

var initRun = 'false';
var runUrl = ui.url.get('run', initRun);
ui.url.set('run', runUrl);

var initLon = -122.91966;
var lonUrl = ui.url.get('lon', initLon);
ui.url.set('lon', lonUrl);

var initLat = 44.24135;
var latUrl = ui.url.get('lat', initLat);
ui.url.set('lat', latUrl);

var initFrom = '06-10';
var fromUrl = ui.url.get('from', initFrom);
ui.url.set('from', fromUrl);

var initTo = '09-20';
var toUrl = ui.url.get('to', initTo);
ui.url.set('to', toUrl);

var initIndex = 'NBR';
var indexUrl = ui.url.get('index', initIndex);
ui.url.set('index', indexUrl);

var initRgb = 'SWIR1/NIR/GREEN';
var rgbUrl = ui.url.get('rgb', initRgb);
ui.url.set('rgb', rgbUrl);

var initChipWidth = 2;
var chipWidthUrl = ui.url.get('chipwidth', initChipWidth);
ui.url.set('chipwidth', chipWidthUrl);



// #############################################################################
// ### DEFINE UI ELEMENTS ###
// #############################################################################

// Style.
var CONTROL_PANEL_WIDTH = '270px';
var CONTROL_PANEL_WIDTH_HIDE = '141px';
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
  'This app shows a Landsat time series chart and image chips for selected ' +
  'locations within image composites. Images are median annual composites ' +
  'generated for a given time window (can cross the new year). Time series ' +
  'point colors are defined by RGB assignment to selected bands where ' +
  'intensity is based on the area-weighted mean pixel value within a 45 m ' +
  'radius circle around the clicked point in the map.',
  infoFont);

var appCodeLink = ui.Label({
  value: 'App source code',
  style: {fontSize: '11px', color: '#505050', margin: '-4px 8px 0px 8px'}, 
  targetUrl: 'https://github.com/jdbcode/ee-rgb-timeseries/blob/main/landsat-timeseries-explorer.js'
});

// Date panel.
var dateSectionLabel = ui.Label(
  'Annual composite range (month-day)', headerFont);
var startDayLabel = ui.Label('From:', textFont);
var startDayBox = ui.Textbox({value: ui.url.get('from'), style: textFont});
startDayBox.style().set('stretch', 'horizontal');

var endDayLabel = ui.Label('To:', textFont);
var endDayBox = ui.Textbox({value: ui.url.get('to'), style: textFont});
endDayBox.style().set('stretch', 'horizontal');

var datePanel = ui.Panel([
    dateSectionLabel,
    ui.Panel([startDayLabel, startDayBox, endDayLabel, endDayBox],
      ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'})
  ], null, {margin: '0px'});

// Y-axis index selection.
var indexLabel = ui.Label('Y-axis index', headerFont); //  (bands are LC08)
var indexList = ['NBR', 'NDVI', 'BLUE', 'GREEN', 'RED', 'NIR', 'SWIR1', 'SWIR2']; // 'TCB', 'TCG', 'TCW',
var indexSelect = ui.Select(
  {items: indexList, value: ui.url.get('index'), style: {stretch: 'horizontal'}});
var indexPanel = ui.Panel(
  [indexLabel, indexSelect], null, {stretch: 'horizontal'});

// RGB bands selection.
var rgbLabel = ui.Label({value: 'RGB visualization', style: headerFont});
var rgbList = ['SWIR1/NIR/GREEN', 'RED/GREEN/BLUE', 'NIR/RED/GREEN',
               'NIR/SWIR1/RED']; // 'TCB/TCG/TCW', 
var rgbSelect = ui.Select({
  items: rgbList, placeholder: ui.url.get('rgb'),
  value: ui.url.get('rgb'), style: {stretch: 'horizontal'}
});
var rgbPanel = ui.Panel([rgbLabel, rgbSelect], null, {stretch: 'horizontal'});

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
var messageStyle = {
    stretch: 'horizontal',
    //textAlign: 'center',
    backgroundColor: '#d3d3d3'
  }
var gears = 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolssharp/settings/wght100grad200fill1/24px.svg'
var waitMsgImgPanel = ui.Panel([ui.Label({imageUrl: gears, style: {backgroundColor: '#d3d3d3'}}), ui.Label({
  value: 'Processing, please wait.',
  style: {backgroundColor: '#d3d3d3', fontSize: '16px', fontWeight: 'bold', margin: '10px 0px 0px 0px'}
})], ui.Panel.Layout.flow('horizontal'), messageStyle);

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
var submitButton = ui.Button(
  {label: 'Submit changes', style: {stretch: 'horizontal', shown: false}});



// #############################################################################
// ### DEFINE INITIALIZING CONSTANTS ###
// #############################################################################

// Set color of the circle to show on map and images where clicked
var AOI_COLOR = 'ffffff';  //'b300b3';

// Define vis params.
var VIS_PARAMS = {
  bands: ['SWIR1', 'NIR', 'GREEN'],
  min: [0, 0, 0], //[0.100, 0.151 , 0.50],
  max: [0.45, 0.45, 0.45], //[0.4500, 0.4951, 0.2500],
  gamma: [1, 1, 1] // [1, 1, 1]
};

var RGB_PARAMS = {
  'SWIR1/NIR/GREEN': {
    bands: ['SWIR1', 'NIR', 'GREEN'],
    min: [0, 0, 0], //[0.100, 0.151 , 0.50],
    max: [0.45, 0.45, 0.45], //[0.4500, 0.4951, 0.2500],
    gamma: [1, 1, 1] // [1, 1, 1]
  },
  'RED/GREEN/BLUE': {
    bands: ['RED', 'GREEN', 'BLUE'],
    min: [0, 0, 0], //[.0, .50, .50],
    max: [0.25, 0.25, 0.25], //[.2500, .2500, .2500],
    gamma: [1.2, 1.2, 1.2], //[1.2, 1.2, 1.2]
  },
  'NIR/RED/GREEN': {
    bands: ['NIR', 'RED', 'GREEN'],
    min: [0, 0, 0], //[.151, .0, .50],
    max: [0.45, 0.45, 0.45], //[.4951, .2500, .2500],
    gamma: [0.95, 0.95, 0.95], //[1, 1, 1]
  },
  // 'TCB/TCG/TCW': {
  //   bands: ['TCB', 'TCG', 'TCW'],
  //   min: [604, -49, -2245],
  //   max: [5592, 3147, 843],
  //   gamma: [1, 1, 1]
  // },
  'NIR/SWIR1/RED': {
    bands: ['NIR', 'SWIR1', 'RED'],
    min: [0, 0, 0], //[.151, .100, .50],
    max: [0.45, 0.45, 0.45], //[.4951, .4500, .2500],
    gamma: [1, 1, 1], //[1, 1, 1]
  }
};

var COORDS = null;
var CLICKED = false;

// Set region reduction and chart params.
var OPTIONAL_PARAMS = {
  reducer: ee.Reducer.mean(),
  scale: 30,
  crs: 'EPSG:4326',
  chartParams: {
    pointSize: 14,
    legend: {position: 'none'},
    hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
    vAxis: {
      title: indexSelect.getValue(),
      titleTextStyle: {italic: false, bold: true}
    },
    explorer: {}
  }
};

// // Set initial ee-lcb params: the date range is for CONUS summer.
// var LCB_PROPS = {
//   startYear: 1984,
//   endYear: new Date().getFullYear(), 
//   startDate: startDayBox.getValue(),
//   endDate: endDayBox.getValue(),
//   sensors: ['LT05', 'LE07', 'LC08'],
//   cfmask: ['cloud', 'shadow'],
//   printProps: false
// };
// lcb.setProps(LCB_PROPS);



// #############################################################################
// ### DEFINE FUNCTIONS ###
// #############################################################################

// /**
// * ee-lcb annual Landsat collection plan.
// */
// function imgColPlan(year){
//   var col = lcb.sr.gather(year)
//     .map(lcb.sr.maskCFmask)
//     .map(lcb.sr.addBandNBR)
//     .map(lcb.sr.addBandNDVI)
//     .map(lcb.sr.addBandTC);
//   return lcb.sr.mosaicMedian(col);
// }

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

  var visParams = RGB_PARAMS[rgbSelect.getValue()];
  
  var dates = col.aggregate_array('composite_year');
  
  dates.evaluate(function(dates) {
    waitMsgImgPanel.style().set('shown', false);
    dates.forEach(function(date) {
      var img = col.filter(ee.Filter.eq('composite_year', date)).first();
      
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
 * Generates composite time series.
 */
function getCol(geometry) {
  var startDate = '1984-' + startDayBox.getValue();
  var compositeDuration = null;
  if (endDayBox.getValue() >= startDayBox.getValue()) {
    compositeDuration = ee.Date('1984-' + endDayBox.getValue())
      .difference(ee.Date('1984-' + startDayBox.getValue()), 'days');
  } else {
    compositeDuration = ee.Date('1984-' + endDayBox.getValue())
      .difference(ee.Date('1983-' + startDayBox.getValue()), 'days');
  }
  var compositeDurationUnit = 'days';
  var stepValue = 1;
  var stepUnit = 'year';
  var nSteps = new Date().getFullYear() - 1984 + 1;
  
  var col = lsc.makeCompositeTs(
    startDate, compositeDuration, compositeDurationUnit, stepValue, stepUnit, nSteps, geometry);

  col = col.map(function(img) {
    return img.set('composite_year', ee.Date(img.getNumber('start_time')).get('year'));
  });

  return col; 
}


// function drawMapImg() {
//   var col = getCol(ee.Geometry.Rectangle(map.getBounds(), null, false));
//   var img = col.select(indexSelect.getValue()).toBands()
//   RGB_PARAMS[rgbSelect.getValue()].min[0]
//   map.addLayer(img, {min: RGB_PARAMS[rgbSelect.getValue()].min[0], max: RGB_PARAMS[rgbSelect.getValue()].max[0]})
// }
// map.onChangeBounds(ui.util.debounce(drawMapImg, 500))




/**
 * Generates chart and adds image cards to the image panel.
 */
function renderGraphics(coords) {
  // Get the selected RGB combo vis params.
  var visParams = RGB_PARAMS[rgbSelect.getValue()];
  
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
  
  // // Build annual time series collection.
  // LCB_PROPS['aoi'] = aoiBox;
  // LCB_PROPS['startDate'] = startDayBox.getValue();
  // LCB_PROPS['endDate'] = endDayBox.getValue();
  // lcb.props = lcb.setProps(LCB_PROPS);
  
  // // Define annual collection year range as ee.List.
  // var years = ee.List.sequence(lcb.props.startYear, lcb.props.endYear);
  // var col = ee.ImageCollection.fromImages(years.map(imgColPlan));

  var col = getCol(aoiBox);

  // Display the image chip time series. 
  displayBrowseImg(col, aoiBox, aoiCircle);

  OPTIONAL_PARAMS['chartParams']['vAxis']['title'] = indexSelect.getValue();

  // Render the time series chart.
  rgbTs.rgbTimeSeriesChart(col, aoiCircle, indexSelect.getValue(), visParams,
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
  ui.url.set('from', startDayBox.getValue());
  ui.url.set('to', endDayBox.getValue());
  ui.url.set('index', indexSelect.getValue());
  ui.url.set('rgb', rgbSelect.getValue());
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
controlElements.add(datePanel);
controlElements.add(indexPanel);
controlElements.add(rgbPanel);
controlElements.add(regionWidthPanel);
controlElements.add(submitButton);

controlPanel.add(instr);
controlPanel.add(buttonPanel);
controlPanel.add(infoElements);
controlPanel.add(controlElements);

map.add(controlPanel);

infoButton.onClick(infoButtonHandler);
controlButton.onClick(controlButtonHandler);
startDayBox.onChange(optionChange);
endDayBox.onChange(optionChange);
rgbSelect.onChange(optionChange);
indexSelect.onChange(optionChange);
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
