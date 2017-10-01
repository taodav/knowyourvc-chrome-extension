// Original JavaScript code by Chirp Internet: www.chirp.com.au
// Please acknowledge use of this code by including this header.

function Hilitor(id, tag)
{

  var targetNode = document.getElementById(id) || document.body;
  var hiliteTag = tag || "EM";
  var skipTags = new RegExp("^(?:" + hiliteTag + "|SCRIPT|FORM|SPAN)$");
  var colors = ["#ff6", "#a0ffff", "#9f9", "#f99", "#f6f"];
  var wordColor = [];
  var colorIdx = 0;
  var matchRegex = "";
  var nameMatches = [];
  var openLeft = false;
  var openRight = false;

  // characters to strip from start and end of the input string
  var endCharRegex = new RegExp("^[^\\\w]+|[^\\\w]+$", "g");

  // characters used to break up the input string into words
  var breakCharRegex = new RegExp("[^\\\w'-]+", "g");

  this.setMatchType = function(type)
  {
    switch(type)
    {
      case "left":
        this.openLeft = false;
        this.openRight = true;
        break;

      case "right":
        this.openLeft = true;
        this.openRight = false;
        break;

      case "open":
        this.openLeft = this.openRight = true;
        break;

      default:
        this.openLeft = this.openRight = false;

    }
  };

  this.setRegex = function(input)
  {
    input = input.replace(endCharRegex, "");
    // input = input.replace(breakCharRegex, "|");
    input = input.replace(/^\||\|$/g, "");
    if(input) {
      var re = "(" + input + ")";
      if(!this.openLeft) re = "\\b" + re;
      if(!this.openRight) re = re + "\\b";
      matchRegex = new RegExp(re, "i");
      return true;
    }
    return false;
  };

  this.getRegex = function()
  {
    var retval = matchRegex.toString();
    retval = retval.replace(/(^\/(\\b)?|\(|\)|(\\b)?\/i$)/g, "");
    retval = retval.replace(/\|/g, " ");
    return retval;
  };

  // recursively apply word highlighting
  this.hiliteWords = function(node)
  {
    var doc;

    if(node === undefined || !node) return;
    if(skipTags.test(node.nodeName)) return;
    
    if(node.hasChildNodes()) {
      for(var i=0; i < node.childNodes.length; i++)
        this.hiliteWords(node.childNodes[i]);
    }
    if(node.nodeType == 3) { // NODE_TEXT
      doc = nlp(node.nodeValue);
      var data = doc.topics().data();
      if (data.length > 0) {
        var self = this;
        data.map(function(entity) {
          if (entity.hasOwnProperty('firstName')) {
            var firstName = entity.firstName.charAt(0).toUpperCase() + entity.firstName.slice(1);
            var lastName = entity.lastName.charAt(0).toUpperCase() + entity.lastName.slice(1);
            self.setRegex(firstName + ' ' + lastName);
            if(!matchRegex) return;
            var regs;
            if((nv = node.nodeValue) && (regs = matchRegex.exec(nv))) {
              if(!wordColor[regs[0].toLowerCase()]) {
                wordColor[regs[0].toLowerCase()] = colors[colorIdx++ % colors.length];
              }

              var wrapper = document.createElement('div');
              var popup = document.createElement('div');
            
              var title = document.createElement('h2');
              title.className = 'knowyourvc-investor-title';
              title.innerHTML = 'Review from Know Your VC';
          
            
              var text = document.createElement('p');
              var investorId;

              //GET request here
              $.get('https://31a57977.ngrok.io/api/investors/search', { name: firstName + ' ' + lastName }, function(res) {
                // $.get('https://knapi.herokuapp.com/api/investors/search/', { name: firstName + ' ' + lastName }, function(res) {
                text.className = "knowyourvc-investor-text";
                popup.className = "knowyourvc-investor-popup";
                popup.style.display = "none";
              
                if (!res.investorId) {
                  return;
                }

                if (res.review) {
                  text.innerHTML = res.review.comment + '\n';
                } else {
                  text.innerHTML = 'No reviews - click here to be the first to review!'
                }

                // create match wrapper
                var matchWrapper = document.createElement('div')
                matchWrapper.style.display = 'inline-block';
                matchWrapper.className = 'knowyourvc-investor-wrapper'

                var match = document.createElement(hiliteTag);
                match.appendChild(document.createTextNode(regs[0]));
                match.className = "knowyourvc-investor"
                match.style.backgroundColor = wordColor[regs[0].toLowerCase()];
                match.style.fontStyle = "inherit";
                match.style.color = "#000";

                popup.append(title);
                popup.appendChild(text);

                matchWrapper.appendChild(match);
                matchWrapper.appendChild(popup);
                var after = node.splitText(regs.index);
                after.nodeValue = after.nodeValue.substring(regs[0].length);
                node.parentNode.insertBefore(matchWrapper, after);

                popup.onclick = function() {
                  if (res.investorId) {
                    window.open("http://knowyourvc.com/investors/" + res.investorId);
                  }
                }
                popup.style.display = "none";
          
                $(matchWrapper).hover(function() {
                  popup.style.display = "inherit"
                }, function() {
                  popup.style.display = "none";
                })
              })

              
      

            }
          }
        })
      }

    };
  };

  // remove highlighting
  this.remove = function()
  {
    var arr = document.getElementsByTagName(hiliteTag);
    while(arr.length && (el = arr[0])) {
      var parent = el.parentNode;
      parent.replaceChild(el.firstChild, el);
      parent.normalize();
    }
  };

  // start highlighting at target node
  this.apply = function()
  {
    this.remove();
    this.hiliteWords(targetNode);
  };

}

var myHilitor;

var callback = function() {
  // Handler when the DOM is fully loaded
  console.log("i'm being loaded")
  myHilitor = new Hilitor();
  myHilitor.apply();
}

if (
  document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  callback();
} else {
  window.addEventListener("load", callback)
}
