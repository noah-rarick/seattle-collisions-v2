require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/core/reactiveUtils",
    "esri/layers/support/FeatureReductionBinning",
    "esri/layers/support/AggregateField",
    "esri/layers/support/LabelClass",
    "esri/widgets/Legend",
], function(esriConfig, Map, MapView, FeatureLayer, reactiveUtils, FeatureReductionBinning, AggregateField, LabelClass, Legend) {
    esriConfig.apiKey = "AAPK76781a872cbc4f3586992bdb98501e2eangcJw2b7mb9HuZUOhY2gpytnsSM8fd8hV6sDjOMDBSbGdCpUA3oYKBRufAQEg4x";
    const map = new Map({
        basemap: "arcgis/streets-night" // You can change the basemap here.
    });

    const view = new MapView({
        container: "viewDiv", // This is the ID of the div where the map will be rendered.
        map: map,
        zoom: 11, // Sets zoom level based on scale
        center: [-122.3321, 47.6562], // Sets the center point of view in longitude,latitude
        minScale: 0,
        maxScale: 80000,
        constraints: {
            minScale: 1155582,
            snapToZoom: false
        }
    });

    const collisions = new FeatureLayer({
        url: "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/SDOT_Collisions_All_Years/FeatureServer/0",
        outFields: ["REPORTNO", "LOCATION", "INJURIES", "SERIOUSINJURIES", "PEDCOUNT", "VEHCOUNT", "FATALITIES", "INATTENTIONIND", "UNDERINFL"],
        definitionExpression: "1=1", // Adjust this to limit data based on the most common queries
        popupTemplate: {
            title: "Collision Report #: {REPORTNO}",
            content: function(feature) {
                const coords = feature.graphic.geometry;
                const streetviewUrl= 'https://google.com/maps?q=&layer=c&cbll=' + coords.latitude + ',' + coords.longitude;
                console.log(streetviewUrl);
                return "Location: {LOCATION}<br>Number of Injuries: {INJURIES}<br>Number of Serious Injuries: {SERIOUSINJURIES}<br>Pedestrians: {PEDCOUNT}<br>Vehicles: {VEHCOUNT}<br>Fatalities: {FATALITIES}<br>Inattentive Driver: {INATTENTIONIND}<br>Under Influence: {UNDERINFL}<br>"
            + '<a href='+ streetviewUrl + '>Street View</a>';
            }
        }
    });

    const colors = [
        "rgba(0, 170, 255, .8)",
        "rgba(0, 96, 166, .8)",
        "rgba(64, 62, 58, .8)",
        "rgba(128, 25, 33, .8)",
        "rgba(217, 43, 43, .8)"
    ];


    const heatmapRenderer = {
        // field: "INJURIES",
        type: "heatmap",
        colorStops: [
        { color: "rgba(255, 255, 255, 0)", ratio: 0 },    // Transparent for the lowest values
        { color: "rgba(0, 170, 255, .7)", ratio: 0.2 }, // Light yellow for low values
        { color: "rgba(0, 96, 166, .7)", ratio: 0.4 }, // Light orange for medium-low values
        { color: "rgba(64, 62, 58, .7)", ratio: 0.6 }, // Orange for medium values
        { color: "rgba(128, 25, 33, .7)", ratio: 0.8 },  // Dark orange for medium-high values
        { color: "rgba(217, 43, 43, .7)", ratio: 0.9 },  // Red-orange for high values
        { color: "rgba(240, 59, 32, .7)", ratio: 1 } 
        ],
        minDensity: 0,
        maxDensity: 0.319,
        radius: 10,
        referenceScale: 46000,
        
        legendOptions: {
        minLabel: "Low Collision Density",
        maxLabel: "High Collision Density"
      }
    };

    collisions.renderer = heatmapRenderer;

    map.add(collisions);
    const layer = collisions;
    //Promise that resolves when the view is ready
    view.when().then(() => {

        // Function to update collision data based on current view extent
        view.whenLayerView(collisions).then(function(layerView) {

            view.watch("extent", debounce((extent) => {
                updateChart();
                updateGaugeChart();
            }, 250));

            
            let legend = new Legend({
                view: view
            });
            
            view.ui.add(legend, "bottom-right");

            //as the scale changes, update the chart viz
            view.watch("scale", debounce((scale) => {
                scaleUpdate(scale);
            }, 250));
            

            // Function to update the chart based on the current view extent

            const updateGaugeChart = function() {
                let query = collisions.createQuery();
                query.geometry = view.extent; // Use the current view extent
                query.returnGeometry = false;
                query.outStatistics = [
                    { // Total number of injuries
                        onStatisticField: "INJURIES", 
                        outStatisticFieldName: "totalInjuries",
                        statisticType: "sum"
                    },
                    { // Total number of collisions
                        onStatisticField: "REPORTNO", 
                        outStatisticFieldName: "count",
                        statisticType: "count"
                    }
                ];
            
                collisions.queryFeatures(query).then(function(result) {
                    if (result.features.length > 0) {
                        let stats = result.features[0].attributes;
                        let totalInjuries = stats.totalInjuries;
                        var collisionCountElement = document.getElementById("collision-count");
                        collisionCountElement.innerHTML = `Total Collisions: ${stats.count}`;
                        let totalCollisions = stats.count;
                        let injuryRate = totalCollisions > 0 ? (totalInjuries / totalCollisions) : 0; // Avoid division by zero
                        
                        // Update the C3 gauge chart with the injury rate
                        const chart = c3.generate({
                            bindto: '#rate-chart', // Specify the ID of the chart container
                            data: {
                                columns: [
                                    ['Injury Rate', injuryRate]
                                ],
                                type: 'gauge'
                            },
                            gauge: {
                                label: {
                                    format: function(value, ratio) {
                                        return (value * 100).toFixed(2) + "%"; // Display the raw value
                                    }
                                },
                                min: 0, // Set gauge's minimum and maximum if necessary
                                max: 1, // Assuming the injury rate cannot exceed 1 (adjust as needed)
                                
                            },
                            color: {
                                pattern: [colors[0], colors[1], colors[3], colors[4]], // Colors for different ranges, adjust as needed
                                threshold: {
                                    // Adjust these based on what you consider low/medium/high rates
                                    unit: 'value', // Use 'value' if you're specifying exact points; otherwise 'ratio' for percentage of max
                                    values: [0.25, 0.3, 0.35, .4] // Change these values based on your rate thresholds
                                },
                            },
                            size: {
                                height: 180 // Adjust the height of the gauge chart
                            }
                        });
                    }
                });
            };

            const updateChart = function() {
                // Perform individual queries for each injury count category
                let injuryCategories = [0,1, 2, 3, 4, 5, 6, 7, 8, "9+"]; // Ensure this reflects your actual categories
                let queries = injuryCategories.map(injuryCount => {
                    let query = collisions.createQuery();
                    query.returnGeometry = false;
                    query.geometry = view.extent;
                    if (injuryCount === "9+") {
                        query.where = "INJURIES >= 9"; // Adjust for actual field and value
                    } else {
                        query.where = `INJURIES = ${injuryCount}`; // Adjust for actual field and value
                    }
                    return collisions.queryFeatureCount(query);
                });
            
                // Wait for all queries to complete
                Promise.all(queries).then(results => {
                    // Convert results into a format suitable for a pie chart: [["1", count1], ["2", count2], ...]
                    const chartData = injuryCategories.map((category, index) => [`${category}`, results[index]]);
            
                    const chart = c3.generate({
                        bindto: "#chart",
                        data: {
                            columns: chartData,
                            type: "pie"
                        },
                        color: {
                            pattern: [
                                "#005bb2ff", 
                                "#00488cff", 
                                "#472459ff",
                                "#800000ff",
                                "#a20707ff", 
                                "#c40f0fff", 
                                "#e61616ff", 
                                "#ff4d4dff",
                                "#ff9f70",
                                "#ffc993"// Original color 5
                            ]
                        },
                        tooltip: {
                            format: {
                                title: function (d) { return 'Injuries: ' + name; },
                                name: function (name, ratio, id, index) { return 'Injuries Category: ' + name; },
                                value: function (value, ratio, id, index) {
                                    // Assuming 'value' is the number of collisions
                                    return value + ' collisions'; // Customizes the tooltip text
                                }
                            }
                        }
                        // Remove axis configurations, as they are not used in pie charts
                    });
                });
            };
            

            // const updateChart = function() {
            //     // Perform individual queries for each injury count category
            //     let injuryCategories = [1, 2, 3, 4, 5, 6, 7, 8, "9+"]; // Ensure this reflects your actual categories
            //     let queries = injuryCategories.map(injuryCount => {
            //         let query = collisions.createQuery();
            //         query.returnGeometry = false;
            //         query.geometry = view.extent;
            //         if (injuryCount === "9+") {
            //             query.where = "INJURIES >= 9"; // Adjust for actual field and value
            //         } else {
            //             query.where = `INJURIES = ${injuryCount}`; // Adjust for actual field and value
            //         }
            //         return collisions.queryFeatureCount(query);
            //     });

            //     // Wait for all queries to complete
            //     Promise.all(queries).then(results => {
            //         const chartData = ["Injuries"].concat(results); // Prepend label
            //         console.log("1");

            //         const chart = c3.generate({
            //             bindto: "#chart",
            //             data: {
            //                 columns: [
            //                     chartData
            //                 ],
            //                 type: "bar"
            //             },
            //             colors: {
            //                 pattern: [
            //                     "#ff2638ff", // Original color 1
            //                     "#d31c33ff", // Between color 1 and 2
            //                     "#a6242eff", // Original color 2
            //                     "#812833ff", // Between color 2 and 3
            //                     "#403031ff", // Original color 3
            //                     "#36577dff", // Between color 3 and 4
            //                     "#2e6ca4ff", // Original color 4
            //                     "#2480c7ff", // Between color 4 and 5
            //                     "#1993ffff"  // Original color 5
            //                 ]
            //             },
            //             axis: {
            //                 x: {
            //                     type: "category",
            //                     categories: injuryCategories.map(category => `${category}`), // Label categories
            //                     label: {
            //                         text:"Number of Injuries",
            //                         position: "outer-center"
            //                     }
            //                 },
            //                 y: {
            //                     label: { // Add label configuration here
            //                         text: 'Number of Collisions',
            //                         position: 'outer-middle'
            //                     }
            //                 }
            //             }
            //         });
            //     });
            // };

            // Apply debounce to the updateChart function
            // const debouncedUpdateChart = debounce(updateChart, 400); // Adjust the delay as needed
            // const debouncedGaugeChart = debounce(updateGaugeChart, 400);
            // const debouncedScaleUpdate = debounce(scaleUpdate, 100);

            // as the extent changes, update the chart with debounce
            //initalize the chart upon load
            updateChart();
            updateGaugeChart();
        });

        // Debounce function to limit the number of times a function is called
        function debounce(func, wait, immediate) {
            let timeout;
            return function() {
                const context = this, args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        }

        // Function to update the layer interactivity based on the current renderer
        function updateLayerInteractivity() {
            // Check if the current renderer is a heatmap
            if (collisions.renderer.type === "heatmap") {
                // Disable popups and clicking by setting popupTemplate to null
                collisions.popupTemplate = null;
            } else {
                // Enable popups by restoring the original popupTemplate
                collisions.popupTemplate = {
                    title: "Collision Report #: {REPORTNO}",
                    content: "Location: {LOCATION}<br>Number of Injuries: {INJURIES}<br>Number of Serious Injuries: {SERIOUSINJURIES}<br>Pedestrians: {PEDCOUNT}<br>Vehicles: {VEHCOUNT}<br>Fatalities: {FATALITIES}<br>Inattentive Driver: {INATTENTIONIND}<br>Under Influence: {UNDERINFL}"
                };
            }
        }

        /**
         * Updates the rendering of the map based on the scale value.
         * @param {number} scale - The scale value of the map.
         */
        function scaleUpdate(scale) {
            console.log(scale);
            if (scale > 60000) {
                layer.popupEnabled = false;
                //above 60000 zoom -- keep heatmap static
                layer.featureReduction = null; //nullify feature reduction
                heatmapRenderer.referenceScale = 46000; // Apply static aspect at this scale
                collisions.renderer = heatmapRenderer; // Apply updated renderer
            } else if (10000 < scale && scale < 60000) {
                collisions.popupEnabled = false;
                //between 60000 and 10000 zoom -- keep heatmap dynamic
                layer.featureReduction = null; //nullify feature reduction
                heatmapRenderer.referenceScale = 0; // 0 disables static aspect
                collisions.renderer = heatmapRenderer; // Apply updated renderer
            } else if (10000 > scale && scale > 2000) {
                layer.popupEnabled = true;
                //when the zoom is between 10,000 and 2,000 use binning
                layer.renderer = null; // Disable renderer to use default or set it to another if necessary
                layer.featureReduction = { // Enable feature reduction
                    type: "binning",
                    fields: [
                        new AggregateField({
                            name: "aggregateCollisions",
                            statisticType: "count"
                        }),
                        new AggregateField({
                            name: "averageInjuries",
                            onStatisticField: "INJURIES", // Field name in the dataset
                            outStatisticFieldName: "averageInjuries",
                            statisticType: "avg",
                            format: {
                                places: 2,
                                digitSeparator: true
                            }
                        }),
                        new AggregateField({
                            name: "averageSeriousInjuries",
                            onStatisticField: "SERIOUSINJURIES", // Field name in the dataset
                            outStatisticFieldName: "averageSeriousInjuries",
                            statisticType: "avg",
                            format: {
                                places: 2,
                                digitSeparator: true
                            }
                        })
                    ],
                    fixedBinLevel: 8,
                    opacity: 50,
                    labelsVisible: true,
                    labelingInfo: [
                        new LabelClass({
                            minScale: 144448,
                            maxScale: 0,
                            deconflictionStrategy: "none",
                            symbol: {
                                type: "text",  // autocasts as new TextSymbol()
                                color: "white",
                                font: {
                                    family: "Noto Sans",
                                    size: 10,
                                    weight: "bold"
                                },
                                haloColor: colors[4],
                                haloSize: 0.5
                            },
                            labelExpressionInfo: {
                                expression: "Text($feature.aggregateCollisions, '#,###')"
                            }
                        })
                    ],
                    popupEnabled: true,
                    popupTemplate: {
                        title: "Bin Statistics",
                        content: [
                            {
                                type: "fields",
                                fieldInfos: [
                                    {
                                        fieldName: "aggregateCollisions",
                                        label: "Total Collisions",
                                        format: {
                                            places: 0, // No decimal places for count
                                            digitSeparator: true // Use comma as thousands separator
                                        }
                                    },
                                    {
                                        fieldName: "averageInjuries",
                                        label: "Injury Rate",
                                        format: {
                                            places: 2, // Two decimal places for average
                                            digitSeparator: true // Use comma as thousands separator
                                        }
                                    },
                                    {
                                        fieldName: "averageSeriousInjuries",
                                        label: "Serious Injury Rate",
                                        format: {
                                            places: 2, // Two decimal places for average
                                            digitSeparator: true // Use comma as thousands separator
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    renderer: {
                        type: "simple",
                        symbol: {
                            type: "simple-fill",
                            color: [0, 255, 71],
                            outline: {
                                color: "rgba(153, 31, 23, 0.3)",
                                width: 0.3
                            }
                        },
                        visualVariables: [
                            {
                                type: "color",
                                field: "aggregateCollisions",
                                stops: [
                                    { value: 0, color: colors[0] },
                                    { value: 10, color: colors[1] },
                                    { value: 25, color: colors[2] },
                                    { value: 50, color: colors[3] },
                                    { value: 100, color: colors[4] }
                                ]
                            }
                        ]
                    }
                };
            } else { //scale is less than 2000
                layer.featureReduction = null;
                layer.popupEnabled = true;
                layer.renderer = {
                    type: "unique-value",
                    field: "INJURIES",
                    uniqueValueInfos: [
                        {
                            value: 0,
                            symbol: {
                                type: "simple-marker",
                                style: "circle",
                                color: colors[0],
                                size: "12px"
                            }
                        },
                        {
                            value: 1,
                            symbol: {
                                type: "simple-marker",
                                style: "circle",
                                color: colors[1],
                                size: "20px"
                            }
                        },
                        {
                            value: 2,
                            symbol: {
                                type: "simple-marker",
                                style: "circle",
                                color: colors[3],
                                size: "28px"
                            }
                        },
                        {
                            value: 3,
                            symbol: {
                                type: "simple-marker",
                                style: "circle",
                                color: colors[4],
                                size: "36px"
                            }
                        },
                        // Add more unique value infos for different values of INJURIES
                    ]
                };
            }
        }

        //outside of the view.when() function but still inside the require() function.
        const layer = collisions;
        // var sidebar = document.getElementById('sidebar');
        var sidebar = document.querySelector('.flex-shrink-0.p-3');
        var button = document.getElementById("collapse-button");

    });
})