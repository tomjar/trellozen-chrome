/*jslint indent: 2 */
/*global chrome, console*/

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
                chrome.tabs.sendMessage(tabId,
                    {
                        action: "REFRESH_CSS",
                        boardId: parsedBoardid,
                        tabId: tabId
                    });
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
            parseTrelloBoardId(request.url, sendResponse);
            break;
        }
        case 'INJECT_CSS_RULES': {
            chrome.tabs.insertCSS(request.tabId,
                {
                    code: `.${request.cssClass} { background-image: url("${request.bgUrl}") no-repeat scroll 0% 0% / 100% auto !important;}`
                }, function () {
                });
            sendResponse({});
            break;
        }
    }
}

if (chrome.runtime.onMessage.hasListener(handleMessage_background) === false) {
    chrome.runtime.onMessage.addListener(handleMessage_background);
}