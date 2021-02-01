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

exports.version = '0.1.0';

/**
 * Converts RGB component integer to hex string.
 * 
 * @param {Number} c An integer between 0 and 255 that represents color
 *     intensity.
 * @returns {String}
 * @ignore
 */
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

/**
 * Converts RGB integer set to hex string.
 * 
 * @param {Array} rgb Array of three integers with range [0, 255] that
 *     respectively represent red, green, and blue intensity.
 * @returns {String}
 * @ignore
 */
function rgbToHex(rgb) {
  return "#" +
  componentToHex(rgb[0]) +
  componentToHex(rgb[1]) +
  componentToHex(rgb[2]);
}

/**
 * Scales input number to 8-bit range.
 * 
 * @param {Number} val A value to clamp between a given range and scale to
 *     8-bit representation.
 * @param {Number} min The minimum value to clamp the input number to.
 * @param {Number} max The maximum value to clamp the input number to.
 * @returns {Number}
 * @ignore
 */
function scaleToByte(val, min, max) {
  val = ee.Number.clamp(val, min, max);
  return ee.Number.expression({
    expression: 'round((val - min) / (max - min) * 255)',
    vars: {
      val: val,
      min: min,
      max: max
    } 
  });
}

/**
 * Plots a chart to a ui.Panel or the Code Editor Console for a multi-band image
 * time series. Observations are represented as circles whose color is the
 * stretched RGB representation of three selected bands.
 * 
 * @param {ee.ImageCollection} col An image collection representing a time
 *     series of multi-band images. Each image must have a 'system:time_start'
 *     property formatted as milliseconds since the 1970-01-01T00:00:00Z (UTC).
 * @param {ee.Geometry} aoi The region over which to reduce the image data.
 * @param {String} yAxisBand The name of the image band whose region reduction
 *     will be plot along the chart's y-axis.
 * @param {Object} visParams Visualization parameters that assign bands to
 *     red, green, and blue and the range to stretch color intensity over.
 * @param {Array} visParams.bands An array of three band names to respectively
 *     assign to red, green, and blue for RGB visualization.
 * @param {Array} visParams.min An array of three band-specific values that
 *     define the minimum value to clamp the color stretch range to. Arrange the
 *     values in the same order as visParams.bands band names. Use units of the
 *     input image data.
 * @param {Array} visParams.max An array of three band-specific values that
 *     define the maximum value to clamp the color stretch range to. Arrange the
 *     values in the same order as visParams.bands band names. Use units of the
 *     input image data.
 * @param {ui.Panel|String} plotHere Either a ui.Panel to add the chart to or
 *     'console' to print the chart to the Code Editor console.
 * @param {Object} [optionalParams] Optional. A set of optional parameters to set for
 *     controling region reduction and stying the chart.
 * @param {ee.Reducer} [optionalParams.reducer] Optional. The region over which
 *     to reduce data. If unspecified, ee.Reducer.first is used.
 * @param {String} [optionalParams.crs] Optional. The projection to work in. If
 *     unspecified, the projection of the first image is used.
 * @param {Number} [optionalParams.scale] Optional. A nominal scale in meters of
 *     the projection to work in. If unspecified, the nominal scale of the first
 *     image is used.
 * @param {Object} [optionalParams.chartParams] Optional. ui.Chart parameters
 *     accepected by ui.Chart.setOptions. See
 *     https://developers.google.com/earth-engine/guides/charts_style for
 *     more details.
 */
function rgbTimeSeriesChart(
  col, aoi, yAxisBand, visParams, plotHere, optionalParams) {
  // Since using evaluate, indicate that things are working.
  var message = '⚙️ Processing, please wait.';
  if(plotHere != 'console') {
    plotHere.clear();
    plotHere.add(ui.Label(message));
  } else {
    print(message);
  }
  
  // Define default filter parameters.
  var proj = col.first().projection();
  var _params = {
    reducer: ee.Reducer.first(),
    crs: proj.crs(),
    scale: proj.nominalScale(),
    chartParams: {
      pointSize: 10,
      legend: {position: 'none'},
      hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
      vAxis: {title: yAxisBand, titleTextStyle: {italic: false, bold: true}},
      interpolateNulls: true
    }
  };

  // Replace default params with provided params.
  if (optionalParams) {
    for (var param in optionalParams) {
      _params[param] = optionalParams[param] || _params[param];
    }
  }
  
  // Perform reduction.
  var fc = col.map(function(img) {
    var reduction = img.reduceRegion({
      reducer: _params.reducer,
      geometry: aoi,
      scale: _params.scale,
      crs: _params.crs,
      bestEffort: true,
      maxPixels: 1e13,
    });

    return ee.Feature(null, reduction).set({
      'system:time_start': img.get('system:time_start'),
      label: ee.String(yAxisBand+' ').cat(img.date().format('YYYY-MM-dd'))
    });
  })
  .filter(ee.Filter.notNull(col.first().bandNames()));
  
  // Add 3-band RGB color as a feature property.
  var fcRgb = fc.map(function(ft) {
    var rgb = ee.List([
      scaleToByte(ft.get(visParams.bands[0]), visParams.min[0], visParams.max[0]),
      scaleToByte(ft.get(visParams.bands[1]), visParams.min[1], visParams.max[1]),
      scaleToByte(ft.get(visParams.bands[2]), visParams.min[2], visParams.max[2])
    ]);
    return ft.set({rgb: rgb});
  });

  // Filter out observations with no data.
  fcRgb = fcRgb.filter(ee.Filter.notNull(fcRgb.first().propertyNames()));
  
  // Get the list of RGB colors.
  var rgbColors = fcRgb.aggregate_array('rgb');
  
  // Make a chart.
  rgbColors.evaluate(function(rgbColors) {
    var rgbList = [];
    for(var i=0; i<rgbColors.length; i++) {
      rgbList.push(rgbToHex(rgbColors[i]));
    }

    _params.chartParams['colors'] = rgbList;
    
    var chart = ui.Chart.feature.groups(
      fcRgb, 'system:time_start', yAxisBand, 'label')
      .setChartType('ScatterChart')
      .setOptions(_params.chartParams);
    
    if(plotHere != 'console'){
      plotHere.clear();
      plotHere.add(chart);
    } else {
      print(chart);
    }
  });
}
exports.rgbTimeSeriesChart = rgbTimeSeriesChart;

// Example points
var geometry1 = ee.Geometry.Point([-122.167503, 44.516868]).buffer(45);  // forest harvest
var geometry2 = ee.Geometry.Point([-122.201595, 44.511052]).buffer(45);  // cool stream bank
