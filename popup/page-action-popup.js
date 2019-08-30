function handleError(error) {
    var errObj = { type: "ERROR", logged: error };
    console.log(errObj);
}

// loading settings from local storage and setting the popup elements values
window.onload = function () {
    'use strict';
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        chrome.runtime.sendMessage({ action: "PARSE_BOARD_ID", obj: tabs[0].url }, function (parsedBoardId) {
            chrome.storage.local.get("backgroundsBoardList", function (items) {

                let board = items.backgroundsBoardList.find(function (element) {
                    return element.boardid === parsedBoardId;
                });

                if (typeof board !== 'undefined') {
                    document.getElementById('textTrelloBackgroundUrl').value = board.url;
                } else {
                    handleError('the trello board was not found in local storage');
                }
            });
        });
    });
};



// Due to the weird way that page action popups behave you cannot simply add a event listener to 
// the button in question, basically you have to listen for any clicks coming from the popup and 
// then determine if that html element that the user clicked is the correct item, 
// if so lets execute our logic!
document.addEventListener("click", function (event) {
    'use strict';
    if (event.target.id === "button-save-background") {
        let url = document.getElementById('textTrelloBackgroundUrl').value;
        saveBackground(url);
    }
});

/**
 * This function sends the necessary messages and call the logic which updates the background image and tiles for the current
 * Trello board.
 * 
 * @param {object} element the button that triggered the click
 */
function saveBackground(url) {
    'use strict';
    // getting the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // getting the trello board id out of the url
        chrome.runtime.sendMessage(
            {
                action: "PARSE_BOARD_ID",
                url: tabs[0].url
            }, function (parsedBoardId) {
                if (parsedBoardId === '') {
                    // no parsed trello boardId, just return
                    handleError('No Trello boardId was parsed!');
                } else {
                    // getting the storage array and adding the new bg image for this trello board
                    chrome.storage.local.get("backgroundsBoardList", function (items) {
                        let boardBackgroundUrlObj =
                        {
                            url: url,
                            boardid: parsedBoardId,
                            css: `#trello-root { background: rgb(0, 0, 0) url("${url}") no-repeat scroll 0% 0% / 100% auto !important;}`,
                            active: true
                        },
                            cssArr = items.backgroundsBoardList.map(function (element) {
                                return element.css;
                            });

                        if (boardBackgroundUrlObj.url === '') {
                            handleError('No image url was provided! Url was not saved for this board.');
                        } else {

                            let currentTzBoardBgIndex = items.backgroundsBoardList.findIndex(function (element) {
                                return element.boardid === parsedBoardId;
                            });

                            if (currentTzBoardBgIndex === -1) {
                                items.backgroundsBoardList.push(boardBackgroundUrlObj);
                            } else {
                                items.backgroundsBoardList[currentTzBoardBgIndex] = boardBackgroundUrlObj;
                                chrome.runtime.sendMessage(
                                    {
                                        action: "REMOVE_CSS",
                                        boardid: boardBackgroundUrlObj.boardid,
                                        cssArr: cssArr,
                                        tabId: tabs[0].id
                                    });
                            }

                            console.log(items.backgroundsBoardList);

                            chrome.storage.local.set({ backgroundsBoardList: items.backgroundsBoardList }, function () {
                                chrome.runtime.sendMessage(
                                    {
                                        action: "INSERT_CSS",
                                        boardid: boardBackgroundUrlObj.boardid,
                                        css: boardBackgroundUrlObj.css,
                                        tabId: tabs[0].id
                                    });
                            });
                        }
                    });
                }
            });
    });
}