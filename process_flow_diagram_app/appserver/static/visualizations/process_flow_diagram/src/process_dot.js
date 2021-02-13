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
    "dagre",
    "graphlib",
    "jointjs",
    'graphlib-dot',
    "process_shapes"
],
    function (
        $,
        _,
        dagre,
        graphlib,
        joint,
        dot,
        processShapes
    ) {
        let dotRenderer = {};

        dotRenderer.buildGraph = function(data) {
            var dot_definition = data[0][0]
             try {
                g = dot.read(dot_definition)
                console.log(g)

                var graph = new joint.dia.Graph;
                
                graph.fromGraphLib(g, {
                    importNode: function(node, glGraph, graph) {
                        let graphNode = glGraph.node(node)

                        let label = graphNode["label"] ? graphNode["label"]: ""
                        console.log(graphNode)
                        if (graphNode["shape"] === "circle") {
                            var new_shape = new joint.shapes.standard.Circle({id: node, attrs: {
                                body: {
                                    fill: graphNode["fillcolor"]
                                },
                                label: {
                                    fill: 'black',
                                    text: label
                                },
                            },
                            position: { x: 100, y: 100 },
                            size: { width: 130, height: 30}
            
                        });
                        } else if (graphNode["shape"] === "box"){

                            var new_shape = new joint.shapes.standard.Rectangle({id: node, attrs: {
                            body: {
                                fill: graphNode["fillcolor"]
                            },
                            label: {
                                text: label,
                                fill: 'black'
                            },
                        },
                        position: { x: 100, y: 100 },
                        size: { width: 130, height: 30}
        
                    });
                    
                    if (label !== "" && graphNode["fillcolor"] === "black") {
                        new_shape.attr({label: {fill: "white"}}) 
                    }
                    var letterSize = 12;
                    var maxLineLength = _.max(label.split("\n"), function (l) { return l.length; }).length;
                    var width = 2 * (letterSize * (0.4 * maxLineLength + 1));
                    width = width < 100 ? 100 : width;
                    width = width > 300 ? 300 : width;
                    new_shape.size({width: width})
                }
        
                        new_shape.addTo(graph)
                    },
                    importEdge: function(edge, glGraph, graph) {
                        console.log(edge)
                        var new_link = new joint.shapes.standard.Link({
                            source: { id: edge.v },
                            target: { id: edge.w }
                        })
                        
                        if (glGraph.edge(edge.v, edge.w)["label"])
                        new_link.appendLabel({
                            attrs: {
                                text: {
                                    text: glGraph.edge(edge.v, edge.w)["label"]
                                }
                            }
                        })
        
                        new_link.addTo(graph)
                    }
                });

                return graph
                
             }
             catch(err) {
                console.log(err)
            }
        }

        return dotRenderer;
    });