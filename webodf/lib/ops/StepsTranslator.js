/**
 * @license
 * Copyright (C) 2012-2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Affero General Public License
 * (GNU AGPL) as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.  The code is distributed
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this code.  If not, see <http://www.gnu.org/licenses/>.
 *
 * As additional permission under GNU AGPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * As a special exception to the AGPL, any HTML file which merely makes function
 * calls to this code, and for that purpose includes it by reference shall be
 * deemed a separate work for copyright law purposes. In addition, the copyright
 * holders of this code give you permission to combine this code with free
 * software libraries that are released under the GNU LGPL. You may copy and
 * distribute such a system following the terms of the GNU AGPL for this code
 * and the LGPL for the libraries. If you modify this code, you may extend this
 * exception to your version of the code, but you are not obligated to do so.
 * If you do not wish to do so, delete this exception statement from your
 * version.
 *
 * This license applies to this entire compilation.
 * @licend
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, core, ops, Node*/

runtime.loadClass("core.DomUtils");
runtime.loadClass("core.PositionFilter");

/**
 *
 * @param {!function():!Node} getRootNode
 * @param {!function(!Node):!core.PositionIterator} newIterator
 * @param {!core.PositionFilter} filter
 * @constructor
 */
ops.StepsTranslator = function StepsTranslator(getRootNode, newIterator, filter) {
    "use strict";
    var domUtils = new core.DomUtils(),
        /**@const*/FILTER_ACCEPT = core.PositionFilter.FilterResult.FILTER_ACCEPT;

    /**
     * Convert the requested steps from root into the equivalent DOM node & offset pair
     * @param {!number} steps
     * @returns {{node: !Node, offset: !number}}
     */
    this.convertStepsToDomPoint = function(steps) {
        var stepsFromRoot = 0,
            iterator = newIterator(getRootNode());
        
        if (steps < 0) {
            runtime.log("warn", "Requested steps were negative (" + steps + ")");
            steps = 0;
        }

        iterator.setUnfilteredPosition(getRootNode(), 0);
        do {
            // Fast-forward to position 0 before starting to count
            if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                break;
            }
        } while(iterator.nextPosition());

        while (stepsFromRoot !== steps && iterator.nextPosition()) {
            if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                stepsFromRoot += 1;
            }
        }
        if (stepsFromRoot !== steps) {
            runtime.log("warn", "Requested " + steps + " steps but only " + stepsFromRoot + " are available");
        }
        return {
            node: iterator.container(),
            offset: iterator.unfilteredDomOffset()
        };
    };

    /**
     * Convert the supplied DOM node & offset pair into it's equivalent steps from root
     * @param {!Node} node
     * @param {!number} offset
     * @returns {!number}
     */
    this.convertDomPointToSteps = function(node, offset) {
        var steps = 0,
            iterator = newIterator(getRootNode()),
            firstPosition = true,
            beforeRoot,
            rootNode = getRootNode();

        if (!domUtils.containsNode(rootNode, node)) {
            beforeRoot = domUtils.comparePoints(rootNode, 0, node, offset) < 0;
            node = rootNode;
            offset = beforeRoot ? 0 : rootNode.childNodes.length;
        }


        iterator.setUnfilteredPosition(node, offset);
        do {
            if (filter.acceptPosition(iterator) === FILTER_ACCEPT) {
                if (!firstPosition) {
                    // Steps round down to the closest prior position.
                    // Therefore, the first passed walkable position is the start position.
                    steps += 1;
                }
                firstPosition = false;
            }
        } while (iterator.previousPosition());
        return steps;
    };

    /**
     * @param {!{position: !number, length: !number}} eventArgs
     */
    /*jslint emptyblock: true, unparam: true*/
    this.handleStepsInserted = function(eventArgs) {
        // Old position = position
        // New position = position + length
        // E.g., {position: 10, length: 1} indicates 10 => 10, New => 11, 11 => 12, 12 => 13
    };

    /**
     * @param {!{position: !number, length: !number}} eventArgs
     */
    this.handleStepsRemoved = function(eventArgs) {
        // Old position = position + length
        // New position = position
        // E.g., {position: 10, length: 1} indicates 10 => 10, 11 => 10, 12 => 11
    };
    /*jslint emptyblock: false, unparam: false*/
};
