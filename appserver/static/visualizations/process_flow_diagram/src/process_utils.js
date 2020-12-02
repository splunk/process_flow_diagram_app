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
    "underscore"
],
function(
    $,
    _
) {
    let processUtils = {};

    processUtils.averageUpdate = function(newMeasure, aggMeasure, numMeasures) {
        return Number(aggMeasure) + ((Number(newMeasure) - Number(aggMeasure)) / Number(numMeasures + 1)); 
    };

    processUtils.minUpdate = function(newMeasure, aggMeasure) {
        return Math.min(Number(aggMeasure), Number(newMeasure)); 
    };

    processUtils.maxUpdate = function(newMeasure, aggMeasure) {
        return Math.max(Number(aggMeasure), Number(newMeasure)); 
    };


    processUtils.mapToRange = function(value, in_min, in_max, out_min, out_max) {
        return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    };

    processUtils.linkHash = function(from, to) {
        return (from + to).toLowerCase();
    };

    return processUtils;
});