// ==UserScript==
// @name        Twitter Hide Trending
// @namespace   Violentmonkey Scripts
// @match       https://*.twitter.com/*
// @grant       none
// @version     1.0
// @author      -
// @description 6/7/2022, 1:37:11 PM
// @require   http://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==

/*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
    that detects and handles AJAXed content.

    Usage example:

        waitForKeyElements (
            "div.comments"
            , commentCallbackFunction
        );

        //--- Page-specific function to do what we want when the node is found.
        function commentCallbackFunction (jNode) {
            jNode.text ("This comment changed by waitForKeyElements().");
        }

    IMPORTANT: This function requires your script to have loaded jQuery.
*/
function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
                                           .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (    selectorTxt,
                                            actionFunction,
                                            bWaitOnce,
                                            iframeSelector
                                        );
                },
                300
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}


// Modify XHR object to be able to access request url
const xhrProto = XMLHttpRequest.prototype,
    origOpen = xhrProto.open;

xhrProto.open = function (method, url) {
    this._url = url;
    return origOpen.apply(this, arguments);
};


waitForKeyElements('[aria-label="Trending"]', hideNodes, false);
waitForKeyElements('[aria-label="Who to follow"]', hideWhoToFollow, false);

waitForKeyElements('[aria-label="Loading recommendations for users to follow"]', hideRecs, false);
waitForKeyElements('[aria-label="Loading timeline"]', hideTimeline, false);

(function(send) {

    XMLHttpRequest.prototype.send = function(data) {
        console.log(this._url);
        // block requests trying to access trending or recommended users
        if (!this._url.startsWith('https://twitter.com/i/api/1.1/users/recommendations')
           && !this._url.startsWith('https://twitter.com/i/api/2/guide')
           ) {
          send.call(this, data);
        }
    };

})(XMLHttpRequest.prototype.send);


function hideWhoToFollow(jNode) {
  jNode[0].style.display = "None";
}

function hideRecs(jNode) {
    const url = window.location.href;
  if (url.endsWith('home')
      || url.match(/.+status\/\d+.*/)) {
    return
  }

  jNode = jNode[0];
  jNode.parentNode.parentNode.style.display = "None";
  jNode.parentNode.style.display = "None";
}

function hideTimeline(jNode) {
  const url = window.location.href;
  if (url.endsWith('home')
    || url.match(/.+status\/\d+.*/)) {
    return
  }
  jNode = jNode[0];

  if (!url.match(/.+search.*/)) {
    jNode.parentNode.parentNode.style.display = "None";
  }
  jNode.parentNode.style.display = "None";

  console.log(jNode.parentNode);
}

function hideNodes(jNode) {
  jNode = jNode[0];
  const url = window.location.href;
  const childNodes = jNode.childNodes[0].childNodes;
  if (url.endsWith('home')
        || url.endsWith('notifications')) {
    childNodes[2].style.display= "None";
  }

  if (childNodes.length > 3) {
    childNodes[3].style.display= "None";
    childNodes[4].style.display= "None";
    if (childNodes.length > 5) {
      childNodes[5].style.display= "None";
    }
  }
}
