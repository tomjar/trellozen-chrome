
// loading settings from local storage and setting the popup elements values
window.onload = function () {
    'use strict';
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.runtime.sendMessage({ action: "PARSE_BOARD_ID", url: tabs[0].url },
            function (parsedBoardId) {
                chrome.storage.local.get("backgroundsBoardList", function (items) {
                    if (items.backgroundsBoardList.length > 0) {
                        let board = items.backgroundsBoardList.find(function (element) {
                            return element.id.toString() === parsedBoardId.toString();
                        });

                        if (typeof board !== 'undefined') {
                            document.getElementById('textTrelloBackgroundUrl').value = board.bgUrl;
                        }
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
function saveBackground(bgUrl) {
    'use strict';
    // getting the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // getting the trello board id out of the url
        chrome.runtime.sendMessage(
            {
                action: "PARSE_BOARD_ID",
                url: tabs[0].url
            }, function (boardId) {
                let isBoardIdValid = boardId !== '',
                    isBgUrlValid = bgUrl !== '';

                if (isBoardIdValid && isBgUrlValid) {
                    // getting the storage array and adding the new bg image for this trello board
                    chrome.storage.local.get("backgroundsBoardList", function (items) {
                        let boardStorageObj =
                        {
                            id: boardId,
                            bgUrl: bgUrl
                        };

                        let bgBoardIndex = items.backgroundsBoardList.findIndex(function (element) {
                            return element.id === boardId;
                        });

                        if (bgBoardIndex === -1) {
                            items.backgroundsBoardList.push(boardStorageObj);
                        } else {
                            items.backgroundsBoardList[bgBoardIndex] = boardStorageObj;
                        }

                        console.log(items.backgroundsBoardList);

                        chrome.storage.local.set({ backgroundsBoardList: items.backgroundsBoardList }, function () {
                            chrome.tabs.sendMessage(tabs[0].id,
                                {
                                    action: "REFRESH_CSS",
                                    boardid: boardId,
                                    tabId: tabs[0].id
                                });
                        });

                    });
                }
            });
    });
}