/*jslint indent: 2 */
/*global browser, document, setTimeout, console*/

function handleError(error) {
    var tempErrObj = { type: "ERROR", message: error };
    console.log(tempErrObj);
}

function outLog(obj) {
    var tempObj = { type: "LOG", logged: obj };
    console.log(tempObj);
}

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.get(["backgroundsBoardList"],
        function (item) {
            if (typeof item.backgroundsBoardList === 'undefined') {
                chrome.storage.local.set({ backgroundsBoardList: [] }, function () {
                    console.log('The local storage array has been initialized successfully.');
                });
            }
        });
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostEquals: 'trello.com' },
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


/**
 * This function retrieves the trello board id from the url provided.
 * 
 * @param {String} url the browsers current trello board url
 * @param {function} callback the send response is a callback function that sends back the boardid
 */
function parseTrelloBoardId(url, callback) {
    'use strict';
    var trelloBoardId = '',
        patt = new RegExp(/https:\/\/*.trello.com\/b\/([\w\d]+)/i),
        matches = patt.exec(url);
    if (matches !== null) {
        trelloBoardId = matches[1];
    } else {
        trelloBoardId = '';
    }
    callback(trelloBoardId.toString());
}

/**
 * TODO
 * 
 * @param {Number} tabId 
 * @param {String} boardId 
 * @param {String} css 
 */
function insertBoardCss(tabId, boardId, css) {
    chrome.storage.local.get("backgroundsBoardList", function (items) {
        let boardIndex = items.backgroundsBoardList.findIndex(function (element) {
            return element.boardid.toString() === boardId.toString();
        });

        if (boardIndex !== -1) {
            chrome.tabs.insertCSS(tabId, { code: css });
            setBoardTiles(tabId);
        }
    });
}

/**
 * TODO
 * 
 * @param {Number} tabId 
 * @param {Array} cssArr 
 */
function removeBoardCss(tabId, cssArr) {
    for (let i = 0; i < cssArr.length; i++) {
        // TODO: not supported in Chrome????
        // chrome.tabs.removeCSS(tabId, { code: cssArr[i] });
    }
}

/**
 * TODO
 * 
 * @param {Number} tabId
 */
function setBoardTiles(tabId) {
    'use strict';
    chrome.tabs.sendMessage(tabId, { action: "SET_BOARD_MENU_TILES" }, function (response) {
        // console.log(response);
    });
}

/**
 * This function is my handler function for the user's tab url is changed, due to the
 * way some websites behave like Trello for example, you cannot rely on the document ready function to run code
 * each time the user clicks something. This allows better control execution of the background image and board tiles.
 * @param {Number} tabId the current tabid
 * @param {Object} changeInfo a object with some helpful attributes/values
 * @param {Object} tab the current tab object
 */
function handleTabOnUpdated(tabId, changeInfo, tab) {
    'use strict';
    parseTrelloBoardId(tab.url, function (parsedBoardid) {
        chrome.storage.local.get("backgroundsBoardList", function (items) {

            if (changeInfo.status === 'complete') {
                let board = items.backgroundsBoardList.find(function (element) {
                    return element.boardid.toString() === parsedBoardid.toString();
                }),
                    boardCssArr = items.backgroundsBoardList.map(function (element) {
                        return element.css;
                    });

                removeBoardCss(tabId, boardCssArr);

                if (typeof board !== 'undefined') {
                    insertBoardCss(tabId, board.boardid, board.css);
                }
            }
        });
    });
}

if (chrome.tabs.onUpdated.hasListener(handleTabOnUpdated) === false) {
    chrome.tabs.onUpdated.addListener(handleTabOnUpdated);
}

/**
 * This function receives messages from content.js
 * Recieves a object with a action, the action determines what happens.
 * @param {Object} request: a object containing a action and other values.
 * @param {Object} sender
 * @param {Object} sendResponse: a value that is consumed by the requestee.
 * @return void
 */
function handleMessage_background(request, sender, sendResponse) {
    'use strict';
    switch (request.action) {
        case 'PARSE_BOARD_ID': {
            parseTrelloBoardId(request.obj, sendResponse);
            break;
        }
        case 'INSERT_CSS': {
            insertBoardCss(request.tabId, request.boardid, request.css);
            break;
        }
        case 'REMOVE_CSS': {
            removeBoardCss(request.tabId, request.cssArr);
            break;
        }
    }
}

if (chrome.runtime.onMessage.hasListener(handleMessage_background) === false) {
    chrome.runtime.onMessage.addListener(handleMessage_background);
}