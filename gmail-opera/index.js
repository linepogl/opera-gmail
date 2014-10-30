var button = chrome.browserAction;

button.onClicked.addListener(function(){

	alert(1);

	var n = new Notification('test');
	n.onshow = function() { setTimeout(notification.close, 15000) };
	

	chrome.notifications.create(Math.random().toString(),{
		type: "list",
		title: "test",
		message: "test desc",
		iconUrl: 'icon-128.png',
		items:
			[{'title':'title1','message':'message1'}
			,{'title':'title2','message':'message2'}
			]
		}
		,function (nid) { window.setTimeout(function(){ chrome.notifications.clear(nid, function(){}); }, 10000);
    });




	chrome.tabs.create({url:'http://www.gmail.com'});
});


var Failure = function(error) {
	button.setBadgeText({text:" ? "});
	button.setIcon({path:"icon-inactive.png"});
	button.setTitle({title:'Gmail\n\n' + error});
	setTimeout(function() {
	  Update();
	}, 15000);
};


var Success = function(feedData) {
	var s = 'Gmail\n';
	var count = 0;
	// var i, folder;
	// for (i = 0; folder = feedData.feeds[i]; i++) {
	//   var k, feed;
	//   for (k = 0; feed = folder.feeds[k]; k++) {
	//     if (feed.unread_count) {
	//       s += '\n' + feed.title + ': ' + feed.unread_count;
	//       count += feed.unread_count;
	//     }
	//   }
	// }
	// for (i = 0; folder = feedData.following[i]; i++) {
	//   if (folder.unread_count) {
	//     count += folder.unread_count;
	//   }
	// }
	
	button.setBadgeText({text:(count==0?'':''+count)});
	button.setIcon({path:"icon-active.png"});
	button.setTitle({title:s});
	setTimeout(function() {
	  Update();
	}, 15000);
};


var Update = function() {
	var httpRequest = new XMLHttpRequest();
	var requestTimeout = window.setTimeout(function() {
	  httpRequest.abort();
	  Failure('Error communicating with the server. Request timed out.');
	}, 30000);
	httpRequest.onerror = function() {
	  Failure('Error communicating with the server.');
	};
	httpRequest.onreadystatechange = function() {
	  if (httpRequest.readyState == 4) {
	    window.clearTimeout(requestTimeout);
	  //   if (httpRequest.status == 401) {
	  //     Failure('You are not logged in.');
	  //   } else if (httpRequest.status >= 400) {
	  //     Failure('Error communicating with the server. HTTP status ' + httpRequest.status + '.');
	  //  } else
	     if (httpRequest.responseText) {
	      var feedData = {
	      };
	      try {
	        // feedData = JSON.parse( httpRequest.responseText );
	        feefData = httpRequest.responseText;
	        Success(feedData);
	      } catch (exception) {
	        Failure('Error communicating with the server. Invalid server response.');
	      }
	    } else {
	      Failure('Error communicating with the server. Invalid server response.');
	    }
	  }
	};
	try {
	  httpRequest.open('GET', 'https://mail.google.com/mail/u/0/feed/atom?'+Math.random(), true);
	  httpRequest.send(null);
	} catch (exception) {
	  Failure('Error communicating with the server.');
	}
};

Update();

