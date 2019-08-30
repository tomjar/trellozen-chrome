
/**
 * TODO
 * 
 * @param {function} callback 
 */
function setBoardTiles(callback) {
    let regexBoardId = new RegExp(/\/b\/([\d\w]+)\/[\S]+/i),
        targetedUniqueClasses = Array.from(document.querySelectorAll('a > div[style]'))
            .map(function (element) {
                let match = regexBoardId.exec(element.parentElement.href);
                return {
                    divChild: element,
                    id: typeof match === 'undefined' || match === null ? '' : match[1]
                };
            });
    chrome.storage.local.get("backgroundsBoardList", function (item) {
        let bgStorage = item.backgroundsBoardList;

        for (let i = 0; i < targetedUniqueClasses.length; i++) {
            for (let j = 0; j < bgStorage.length; j++) {

                if (targetedUniqueClasses[i].id === bgStorage[j].id) {
                    targetedUniqueClasses[i].divChild.classList.add("trellozen");
                    targetedUniqueClasses[i].divChild.style.backgroundImage = `url(${bgStorage[j].bgUrl})`;
                }
            }
        }
    });

    callback({ done: true });
}

/**
 * TODO
 * 
 * @param {function} callback 
 */
function insertCSS(boardId, tabId, callback) {
    chrome.storage.local.get("backgroundsBoardList", function (items) {
        if (items.backgroundsBoardList.length > 0) {

            let board = items.backgroundsBoardList.find(function (element) {
                return element.id === boardId;
            });

            let bgDiv = document.querySelector('div#trello-root'),
                temp = boardId.replace(/(\d+)/g, "");
            bgCssClass = `trellozen-${temp}`,
                bgCssClassLower = bgCssClass.toLowerCase();
            if (typeof board !== 'undefined') {
                // css: `#trello-root { background: rgb(0, 0, 0) url("${url}") no-repeat scroll 0% 0% / 100% auto !important;}`,

                if (bgDiv.classList.contains(bgCssClassLower) === false) {
                    bgDiv.classList.add(bgCssClassLower);
                    chrome.runtime.sendMessage(
                        {
                            action: "INJECT_CSS_RULES",
                            tabId: tabId,
                            bgUrl: board.bgUrl,
                            cssClass: bgCssClassLower.toLowerCase()
                        }, function () {

                            callback();
                        });
                } else {
                    bgDiv.classList.remove(bgCssClassLower);
                }

            }
        }
    });
}

function refreshCSS(boardId, tabId, callback) {
    insertCSS(boardId, tabId, function () {
        setBoardTiles(function (done) {
            callback({ 'done': done });
        });
    });
}


/**
 * This function is my message event listener that allows direct manipulation and access to the HTML
 * of the current tab.
 * @param {Object} request this is a object contains the action to occur
 * @param {Object} sender not used here but another parameter that contains the sender
 * @param {Object} sendResponse this is a callback method, not used here but could be in the future
 */
function handleMessage_content(request, sender, sendResponse) {
    'use strict';
    switch (request.action) {
        case 'REFRESH_CSS': {
            refreshCSS(request.boardId, request.tabId, sendResponse);
            break;
        }
    }
}

if (chrome.runtime.onMessage.hasListener(handleMessage_content) === false) {
    chrome.runtime.onMessage.addListener(handleMessage_content);
}