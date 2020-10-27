define([
    "jquery",
    "underscore",
    "dagre",
    "graphlib",
    "jointjs",
    "process_shapes"
],
    function (
        $,
        _,
        dagre,
        graphlib,
        joint,
        processShapes
    ) {
        let processFlow = {};

        processFlow.initialize = function () {
            /* Define required JointJS shapes */
        };

        processFlow.initializePaper = function(el , graph) {

        };

        processFlow.preComputeGraph = function (events, updateMeasure) {

            context = {
                elements: [],
                elementsMap: new Map(),
                linksMap: new Map(),
                journeysMap: new Map(),
            };

            const reducer = function (context, ev) {
                [journeyId, fromStep, toStep, fromMeasure, ...props] = ev;

                Array.from([fromStep, toStep]).map(step => {
                    if (!context.elementsMap.has(step)) {
                        context.elementsMap.set(step, new Map());
                        context.elements.push(step);
                    }
                    elementJourneysMap = context.elementsMap.get(step);
                    elementJourneysMap.set(journeyId, journeyId);
                    context.journeysMap.set(journeyId, journeyId);
                });

                linkHash = (fromStep + toStep).toLowerCase();

                if (!context.linksMap.has(linkHash)) {
                    context.linksMap.set(linkHash, { "aggMeasure": fromMeasure, "numUpdates": 1, "from": fromStep, "to": toStep });
                } else {
                    let { aggMeasure, numUpdates } = context.linksMap.get(linkHash);
                    newAggMeasure = updateMeasure(fromMeasure, aggMeasure, numUpdates);
                    context.linksMap.set(linkHash, { "from": fromStep, "to": toStep, "aggMeasure": newAggMeasure, "numUpdates": numUpdates + 1 });
                }

                return context;
            };

            return _.reduce(events, reducer, context);
        };

        processFlow.buildGraphShapes = function (preComputedGraph, formatting) {
            let { elements, elementsMap, linksMap } = preComputedGraph;
            let shapes = [];

            elements.forEach(element => {
                elementJourneysMap = elementsMap.get(element);
                shapes.push(this._makeElement(elementJourneysMap.size, element, formatting.elements.get(element)));
            });

            linksMap.forEach(link => {
                let { from, to, aggMeasure } = link;
                from_el = shapes.find(el => el.attr("bodyText/text") == from);
                to_el = shapes.find(el => el.attr("bodyText/text") == to);
                linkHash = (link.from + link.to).toLowerCase();
                shapes.push(this._makeLink(from_el, to_el, aggMeasure, formatting.links.get(linkHash)));
            });

            return shapes;
        };

        processFlow._makeElement = function (head, body, formatting) {
            step = processShapes.Step.create(head, body, formatting.headColor);
            return step;
        };

        processFlow._makeLink = function (from, to, metric, formatting) {
            var l = new joint.shapes.standard.Link();
            l.prop("source", from);
            l.prop("target", to);
            l.attr("line/strokeWidth", formatting.strokeWidth);

            l.appendLabel({
                markup: [
                 {
                     tagName: "rect",
                     selector: "body"
                 },
                 {
                    tagName: "text",
                    selector: "label"
                }      
                ],
                attrs: {
                    body: {
                        ref: "label",
                        fill: "#ffffff",
                        stroke: "black",
                        refWidth: "140%",
                        refHeight: "120%",
                        rx: 5,
                        ry: 5,
                        yAlignment: "middle",
                        xAlignment: "middle",
                    },
                    label: {
                        yAlignment: "middle",
                        xAlignment: "middle",
                        text: parseFloat(metric).toFixed(2),
                        refX: "50%",
                        refY: "50%",
                        fill: "black",
                        fontFamily: "Splunk Platform Sans,Proxima Nova,Roboto,Droid,Helvetica Neue,Helvetica,Arial,sans-serif",
                    },
                },
                position: {
                    distance: 0.5,
                }
            });
            return l;
        };

        return processFlow;
    });