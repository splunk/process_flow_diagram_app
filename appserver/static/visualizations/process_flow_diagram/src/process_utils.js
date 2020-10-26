define([
    'jquery',
    'underscore'
],
function(
    $,
    _
) {
    let processUtils = {}

    processUtils.averageUpdate = function(newMeasure, aggMeasure, numMeasures) {
        return Number(aggMeasure) + ((Number(newMeasure) - Number(aggMeasure)) / Number(numMeasures + 1)) 
    }

    processUtils.minUpdate = function(newMeasure, aggMeasure) {
        return Math.min(Number(aggMeasure), Number(newMeasure)) 
    }

    processUtils.maxUpdate = function(newMeasure, aggMeasure) {
        return Math.max(Number(aggMeasure), Number(newMeasure)) 
    }


    processUtils.mapToRange = function(value, in_min, in_max, out_min, out_max) {
        return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    processUtils.linkHash = function(from, to) {
        return (from + to).toLowerCase()
    }

    return processUtils
});