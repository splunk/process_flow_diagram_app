/* Copyright 2020 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

define([
    "jquery",
    "underscore",
    "api/SplunkVisualizationBase",
    "api/SplunkVisualizationUtils",
    "util/general_utils",
    "svg-pan-zoom",
    "graphlib",
    "dagre",
    "jointjs",
    "process_flow",
    "process_dot",
    "process_utils",
    "d3-interpolate"
],
    function (
        $,
        _,
        SplunkVisualizationBase,
        vizUtils,
        genUtils,
        svgPanZoom,
        graphlib,
        dagre,
        joint,
        processFlow,
        processDot,
        processUtils,
        d3
    ) {

        return SplunkVisualizationBase.extend({
            stepsMode: "gradient",
            stepsMinColor: "#ECF8FF",
            stepsMaxColor: "#003D5E",
            aggregationMethod: "mean",
            variableStrokeWidth: true,
            layoutOrientation: "TB",
            layoutEdgeSep: 80,
            layoutNodeSep: 50,
            linkVertices: true,
            modeDOT: false,

            initialize: function () {
                SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
                this.$el = $(this.el);
                this.$el.append("<div style=\"overflow: none; width:100%; height: 100%;\"> \
                            <div class=\"zoom-controls\"> \
                            <button class=\"btn btn-secondary\" id=\"zoom-in\">Zoom in</button> \
                            <button  class=\"btn btn-secondary\" id=\"zoom-out\">Zoom out</button> \
                            <button  class=\"btn btn-secondary\" id=\"reset\">Reset</button>\
                            </div>\
                <div id=\"process_flow_diagram\"></div></div>");
                this.$processEl = $("#process_flow_diagram");

                processFlow.initialize();
            },

            getInitialDataParams: function () {
                return ({
                    outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                    count: 10000
                });
            },

            formatData: function (data, config) {
                if (data.rows.length < 1)
                    return false;
                
                console.log(data)

                this._getConfigParams(config);
                
                if (this.modeDOT) {
                    graph = processDot.buildGraph(data.rows)
                    return graph
                }

                let aggMethod = processUtils.averageUpdate;
                switch (this.aggregationMethod) {
                    case "mean":
                        break;
                    case "min":
                        aggMethod = processUtils.minUpdate;
                        break;
                    case "max":
                        aggMethod = processUtils.maxUpdate;
                        break;    
                }
                
                precomputeResult = processFlow.preComputeGraph(data.rows, aggMethod);
                formatting = this._buildGraphFormatting(precomputeResult);
                shapes = processFlow.buildGraphShapes(precomputeResult, formatting);
                return shapes;
            },

            updateView: function (shapes, config) {
                if (!shapes) {
                    console.log("No shapes")
                    return false;
                }
                var graph = new joint.dia.Graph;

                if (this.modeDOT) {

                    graph = shapes
                    paper = this._initPaper(graph);

                    this._renderGraph([], graph);

                } else {
                    paper = this._initPaper(graph);

                    this._renderGraph(shapes, graph);
                }
                this._initPanZoom(paper);

            },

            _getEscapedProperty: function(name, config) {
                var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
                return (vizUtils.escapeHtml(propertyValue));
            },

            _getConfigParams: function(config) {
                this.stepsMode = this._getEscapedProperty("stepsMode", config) || this.stepsMode;
                this.stepsMinColor = this._getEscapedProperty("stepsMinColor", config) || this.stepsMinColor;
                this.stepsMaxColor = this._getEscapedProperty("stepsMaxColor", config) || this.stepsMaxColor;
                this.layoutOrientation = this._getEscapedProperty("layoutOrientation", config) || this.layoutOrientation;
                this.layoutNodeSep = parseFloat(this._getEscapedProperty("layoutNodeSep", config)) || this.layoutNodeSep;
                this.layoutEdgeSep = parseFloat(this._getEscapedProperty("layoutEdgeSep", config)) || this.layoutEdgeSep;
                this.linkVertices = genUtils.normalizeBoolean(this._getEscapedProperty("linkVertices", config), { default: this.linkVertices });
                this.modeDOT = genUtils.normalizeBoolean(this._getEscapedProperty("modeDOT", config), { default: this.modeDOT });

                this.aggregationMethod = this._getEscapedProperty("aggregationMethod", config) || this.aggregationMethod;
                this.variableStrokeWidth = genUtils.normalizeBoolean(this._getEscapedProperty("variableStrokeWidth", config), { default: true });
            },

            _buildGraphFormatting(precomputeResult) {
                formatting = {
                    elements: new Map(),
                    links: new Map()
                };
                total_journeys = precomputeResult.journeysMap.size;

                precomputeResult.elementsMap.forEach((val, key) => {
                    step_journeys = val.size;

                    var headColor;

                    if (this.stepsMode == "gradient"){
                        headColor = d3.interpolateLab(this.stepsMinColor, this.stepsMaxColor)(step_journeys / total_journeys);
                    } else {
                        if (val.size == total_journeys) {
                            headColor = "rgb(39,81,38)";
                        }
                    }
                    
                    formatting.elements.set(key, {"headColor": headColor});
                });

                precomputeResult.linksMap.forEach((val, key) => {
                    num_from_journeys = precomputeResult.elementsMap.get(val.from).size;
                    
                    let strokeWidth = 1;
                    if (this.variableStrokeWidth) {
                        strokeWidth = processUtils.mapToRange(num_from_journeys, 1, total_journeys, 1, 5);
                    }
                    formatting.links.set(key, {"strokeWidth": strokeWidth});
                });

                return formatting;
            },

            _initPaper: function(graph) {

                var paper = new joint.dia.Paper({
                    el: $("#process_flow_diagram"),
                    model: graph,
                    width: "100%",
                    height: "100%",
                    gridSize: 5,
                    drawGrid: false
                });

                return paper;
            },

            _initPanZoom: function(paper) {
                
                var panAndZoom;
                panAndZoom = svgPanZoom(document.querySelector("#process_flow_diagram>svg"), 
                    {
                        viewportSelector: document.querySelector("#process_flow_diagram>svg>g.joint-layers"),
                        zoomEnabled: false,
                        controlIconsEnabled: false,                
                        fit: true,
                        center: true,
                        zoomScaleSensitivity: 0.2,
                        panEnabled: true
                });

                paper.on("blank:pointerdown", function (evt, x, y) {
                    panAndZoom.enablePan();
                });

                paper.on("cell:pointerup blank:pointerup", function(cellView, event) {
                        panAndZoom.disablePan();
                });

                document.getElementById("zoom-in").addEventListener("click", function(ev){
                    ev.preventDefault();
          
                    panAndZoom.zoomIn();
                  });
          
                  document.getElementById("zoom-out").addEventListener("click", function(ev){
                    ev.preventDefault();
          
                    panAndZoom.zoomOut();
                  });
          
                  document.getElementById("reset").addEventListener("click", function(ev){
                    ev.preventDefault();
                    panAndZoom.resetPan();
                    panAndZoom.resetZoom();
                  });
                
            },

            _renderGraph: function (shapes, graph) {
                if (shapes.length > 0) {
                graph.addCell(shapes);
                }
                console.log(graph)
                joint.layout.DirectedGraph.layout(graph, {
                    dagre: dagre,
                    graphlib: graphlib,
                    setLinkVertices: this.linkVertices,
                    nodeSep: this.layoutNodeSep,
                    edgeSep: this.layoutEdgeSep,                
                    rankDir: this.layoutOrientation,
                });
                
            },
            reflow: function () { }
        });
    });