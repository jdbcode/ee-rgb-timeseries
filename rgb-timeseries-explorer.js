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

// Import modules.
var rgbTs = require(
  'users/jstnbraaten/modules:rgb-timeseries/rgb-timeseries.js'); 
var lcb = require('users/jstnbraaten/modules:ee-lcb.js'); 

// Handles map clicks: generates chart and adds to the panel.
function renderChart(coords) {
  // Get the clicked point and buffer it.
  coords = ee.Dictionary(coords);
  var aoi = ee.Geometry.Point([coords.get('lon'), coords.get('lat')])
    .buffer(45);
  
  // Clear previous point from the Map.
  Map.layers().forEach(function(el) {
    Map.layers().remove(el);
  });

  // Add new point to the Map.
  Map.addLayer(aoi, {color: '#b300b3'});
  
  // Build annual time series collection.
  lcbProps['aoi'] = aoi;
  lcb.props = lcb.setProps(lcbProps);
  
  // Define annual collection year range as ee.List.
  var years = ee.List.sequence(lcb.props.startYear, lcb.props.endYear);
  var col = ee.ImageCollection.fromImages(years.map(plan));
  
  // Render the time series chart.
  rgbTs.rgbTimeSeriesChart(
    col, aoi, Y_AXIS_BAND, VIS_PARAMS, chartPanel, OPTIONAL_PARAMS);
}

// Set initial ee-lcb params: the date range is for CONUS summer.
var lcbProps = {
  startYear: 1984,
  endYear: 2020,
  startDate: '06-20',
  endDate: '09-10',
  sensors: ['LT05', 'LE07', 'LC08'],
  cfmask: ['cloud', 'shadow'],
  printProps: false
}
lcb.setProps(lcbProps);

// Define an annual collection plan.
var plan = function(year){
  var col = lcb.sr.gather(year)
    .map(lcb.sr.maskCFmask)
    .map(lcb.sr.addBandNBR);
  return lcb.sr.mosaicMean(col);
};

// Define constants: use NBR for y-axis, SWIR1, NIR, Green for RGB.
var Y_AXIS_BAND = 'NBR';

var VIS_PARAMS = {
  bands: ['B6', 'B5', 'B3'],
  min: [0, 0, 0],
  max: [4000, 4000, 4000]
};

// Set region reduction and chart params.
var OPTIONAL_PARAMS = {
  reducer: ee.Reducer.mean(),
  scale: 30,
  crs: 'EPSG:5070',  // Good for CONUS
  chartParams: {
    pointSize: 14,
    legend: {position: 'none'},
    hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
    vAxis: {title: Y_AXIS_BAND, titleTextStyle: {italic: false, bold: true}},
    explorer: {}
  }
};

// Define the panel to hold the chart(s).
var chartPanel = ui.Panel();

// Add the panel to the console.
print(chartPanel);

// Add instructions to the Map.
var instrMsg = ui.Label('Click a point, get a 📈', {position: 'top-center'});
Map.add(instrMsg);

// TODO: add a link to GitHub repo in bottom-right

// Add click hander to the Map.
Map.onClick(renderChart);

// Set cursor as crosshair.
Map.style().set('cursor', 'crosshair');

// Make base layer satellite.
Map.setOptions('SATELLITE');

// Adjust Map view.
Map.centerObject(ee.Geometry.Point([-122.91966, 44.24135]), 14);
