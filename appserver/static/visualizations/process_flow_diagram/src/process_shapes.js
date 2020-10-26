define([
    'jquery',
    'underscore',
    'dagre',
    'graphlib',
    'jointjs'
],
    function (
        $,
        _,
        dagre,
        graphlib,
        joint
    ) {
        let processShapes = {}

        processShapes.Step = joint.shapes.standard.HeaderedRectangle.define('process.Step', {
                attrs: {
                    body: {
                        strokeWidth: 2,
                    },
                    bodyText: {
                        fontFamily: 'Splunk Platform Mono,Inconsolata,Consolas,Droid Sans Mono,Monaco,Courier New,Courier,monospace',
                    },
                    header: {
                        fill: 'grey',
                    },
                    headerText: {
                        fill: 'white',
                        fontFamily: "Splunk Platform Sans,Proxima Nova,Roboto,Droid,Helvetica Neue,Helvetica,Arial,sans-serif",
                    }
                },
                size: {
                    width: 175,
                    height: 60
                }
            }, {
            }, {
                create: function (header, body, headColor = "rgb(238, 238, 238)"){
                    var step = new this();

                    var letterSize = 12;
                    var maxLineLength = _.max(body.split('\n'), function (l) { return l.length; }).length;
                    var width = 2 * (letterSize * (0.4 * maxLineLength + 1));
                    width = width < 100 ? 100 : width;
                    width = width > 300 ? 300 : width;

                    var rgb = headColor.match(/\d+/g);

                    let headTextColor = (rgb[0]*0.299 + rgb[1]*0.587 + rgb[2]*0.114 > 186) ? "#000" : "#fff";

                    var wrapped_text = joint.util.breakText(body, {
                        width: width * 0.7,
                    });

                    step.size({ width: width })

                    step.attr({
                        header: {
                            fill: headColor
                        },
                        headerText: {
                            text: header,
                            fill: headTextColor
                        },
                        bodyText: {
                            text: wrapped_text
                        }
                    });

                    return step;
                }
            });

        return processShapes
    });