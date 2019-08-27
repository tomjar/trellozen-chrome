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
        case 'SET_BOARD_MENU_TILES': {
            let regexBoardId = new RegExp(/\/b\/([\d\w]+)\/[\S]+/i),
                targetedUniqueClasses = Array.from(document.querySelectorAll('a > div[style]'))
                    .map(function (element) {
                        let match = regexBoardId.exec(element.parentElement.href);
                        return {
                            divChild: element,
                            boardId: typeof match === 'undefined' || match === null ? '' : match[1]
                        };
                    });
            chrome.storage.local.get("backgroundsBoardList", function (item) {
                let bgStorage = item.backgroundsBoardList;

                for (let i = 0; i < targetedUniqueClasses.length; i++) {
                    for (let j = 0; j < bgStorage.length; j++) {

                        if (targetedUniqueClasses[i].boardId === bgStorage[j].boardid) {
                            targetedUniqueClasses[i].divChild.style.backgroundImage = `url(${bgStorage[j].url})`;
                        }
                    }
                }
            });

            sendResponse({ classes: targetedUniqueClasses });
        }
    }
}

if (chrome.runtime.onMessage.hasListener(handleMessage_content) === false) {
    chrome.runtime.onMessage.addListener(handleMessage_content);
}