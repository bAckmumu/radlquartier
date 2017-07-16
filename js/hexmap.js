var Hexmap = (function(window, d3, L) {

    var center = [ 48.1351253, 11.581980599999952 ];
    // var layer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     maxZoom: 18,
    //     attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // });

    var baseMaps;
    var overlayMaps;
    var layerStations;
    var layerMunich;
    var layerMvg;
    var hexLayer;
    var districtIndex = 1;
    var map,
        div;

    function init() {
        div = d3.select(".toolTip");

        calculateDistrictCenters(function(){
            initGeoJsonOverlays(function(){
               initHexLayer();

                overlayMaps = {
                    "Munich": layerMunich,
                    "MVG": layerMvg,
                    "Stations": layerStations,
                    "Halts": hexLayer
                };

                var layer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                    minZoom:13,
                    maxZoom: 20,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>'
                });

                map = L.map('hexmap', {
                    layers: [ layer, hexLayer ],
                    center: L.latLng(center[0], center[1]), zoom: 14
                });

                var overlayControl = L.control.layers(null, overlayMaps).addTo(map);

                // loadDistrictHalts(districtIndex);
            });
        });
    }

    function initHexLayer() {
        // Options for the Hexbin
        var options = {
            radius: 12,
            opacity: 0.5,
            // colorRange: [ 'white', 'orange', 'red' ],
            // colorRange: ['white','#f4e94f', '#bcf089', '#50b9a2', '#11afd9','#4970b6', '#604595'],
             colorRange: ['#f3fbfc','#86ccd1', '#5ebeb4', '#11afd9','#4970b6', '#6467c2', '#604595', '#390898'],
            // colorRange: D3.interpolateCool(),
            // Set overrides for the colorScale's domain extent
            colorScaleExtent: [ 1, 900 ],
            radiusRange: [ 4, 10 ]
        };

        // Create the hexlayer
        hexLayer = L.hexbinLayer(options);

        // Set up events
        hexLayer.dispatch()
            .on('mouseover', function(d, i) {
                console.log({ type: 'mouseover', event: d, index: i, context: this });

                div.style("left", d3.event.pageX + 10 + "px");
                div.style("top", d3.event.pageY - 25 + "px");
                div.style("display", "inline-block");
                div.html(((null !== d) ? d.length : '') + " Fahrten");

                // setHovered(d);
            })
            .on('mouseout', function(d, i) {
                // console.log({ type: 'mouseout', event: d, index: i, context: this });
                div.style("display", "none");

                // setHovered();
            })
            .on('click', function(d, i) {
                // console.log({ type: 'click', event: d, index: i, context: this });
                // setClicked(d);
            });

        // hexLayer.setZIndex(650);

        // // Add it to the map now that it's all set up
        // hexLayer.addTo(map);
    }

    function initGeoJsonOverlays(callback) {
        var geojsonMarkerOptions = {
                radius: 5,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
        };

        loadGeoJson('data/munich.geojson', function(munichData) {
            layerMunich = L.geoJSON(munichData);

            loadGeoJson('data/mvgbike.geojson', function(mvgData) {
                layerMvg = L.geoJSON(mvgData);

                loadGeoJson('data/stations.geojson', function(stationData) {
                    layerStations = L.geoJSON(stationData, {
                        pointToLayer: function (feature, latlng) {
                            return L.circleMarker(latlng, geojsonMarkerOptions);
                        }
                    });

                     callback();
                });
            });
        });


        function loadGeoJson( path, callback ) {
            d3.json(path, function(error, data) {
                callback(data);
            });
        }
    }

    // function setHovered(d) {
    //     d3.select('#hovered .count').text((null != d) ? d.length : '');
    // }

    // function setClicked(d) {
    //     d3.select('#clicked .count').text((null != d) ? d.length : '');
    // }

    function loadDistrict(id) {
            loadDistrictHalts(id);
        }

    var districts;
    d3.json('data/munich.geojson', function(error, districtsData) {
        districts = districtsData;
    });

    var districtCenters = {};
    function calculateDistrictCenters(callback) {
        d3.json('data/munich.geojson', function(error, districtsData) {
            districts.features.forEach( function(item) {
                var bounds = d3.geoBounds(item);

                var lng  = (bounds[1][0] + bounds[0][0]) / 2;
                var lat  = (bounds[1][1] + bounds[0][1]) / 2;
                var key = 'id' + item.properties.cartodb_id;

                districtCenters[key] = [lat, lng];
            });
            callback();
        });
    }

    //Load halts data
    function loadDistrictHalts(index) {
        // https://github.com/Leaflet/Leaflet/issues/2738
        map.invalidateSize();

        d3.json('data/halts/cartodb_id_' + index + '.geojson', function(error, districtData) {
            hexLayer.data(districtData);

            var key = 'id' + index;
            map.panTo(districtCenters[key]);
        });
    }

    init();

    return {
        init : init,
        loadDistrict : loadDistrict
    };
})(window, d3, L);