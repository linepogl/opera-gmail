var button = chrome.browserAction;

button.onClicked.addListener(function(){
	chrome.tabs.create({url:'https://mail.google.com/'});
});

var timeout = null;

var Failure = function(error) {
	if (timeout !== null) return;
	button.setBadgeText({text:" ? "});
	button.setIcon({path:"icon-inactive.png?2"});
	button.setTitle({title:'Gmail\n\n' + error});
	timeout = setTimeout(function() { Update(); }, 30000);
};

var Read = function(xml) {
	var feed = {title:'',count:0,entries:[]};
	var a = xml.documentElement.childNodes;
	for (var i = 0; i < a.length; i++) {
		var e = a[i];
		if (e.tagName === 'title')
			feed.title = e.textContent;
		else if (e.tagName === 'fullcount')
			feed.count = parseInt( e.textContent , 10 );
		else if (e.tagName === 'entry') {
			var aa = e.childNodes;
			var entry = {id:'',from:'',from_name:'',from_addr:'',href:'',subj:'',body:''};
			for (var ii = 0; ii < aa.length; ii++) {
				var ee = aa[ii];
				if (ee.tagName === 'id')
					entry.id = ee.textContent;
				else if (ee.tagName === 'link')
					entry.href = ee.getAttribute('href');
				else if (ee.tagName === 'title')
					entry.subj = ee.textContent;
				else if (ee.tagName === 'summary')
					entry.body = ee.textContent;
				else if (ee.tagName === 'author') {
					var aaa = ee.childNodes;
					for (var iii = 0; iii < aaa.length; iii++) {
						var eee = aaa[iii];
						if (eee.tagName === 'name')
							entry.from_name = eee.textContent;
						else if (eee.tagName === 'email')
							entry.from_addr = eee.textContent;
					}
				}
			}
			entry.from = entry.from_name + ' <' + entry.from_addr + '>';
			feed.entries.push(entry);
		}
	}
	return feed;
};

var Summarise = function(entries) {
	var r = '';
	var count = entries.length;
	for (var i = 0; i < count; i++) {
		if (i===10) { r+='\n\n...+'+(count-10)+' more'; break; }
		var entry = entries[i];
		if (r!=='') r+='\n\n';
		r += entry.from_name + '\n"' + entry.subj + '"';
	}
	return r==='' ? 'No unread e-mails' : r;
};

var seen = {};
var Notify = function(entries) {
	var not_seen = [];
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		if (seen.hasOwnProperty(entry.id)) continue;
		not_seen.push(entry);
		seen[entry.id]=entry;
	}
	if (not_seen.length === 0) return;
	chrome.notifications.create(Math.random().toString(),{
		type: "basic"
		,title: not_seen.length + (not_seen.length === 1 ? " new e-mail" : " new e-mails")
		,message: Summarise(not_seen)
		,iconUrl: 'icon-64.png'
	},function(nid){
		setTimeout( function(){ chrome.notifications.clear(nid, function(){}); }, 10000);
	});
};


var Success = function(feedData) {
	if (timeout !== null) return;
	var feed = Read(feedData);
	Notify(feed.entries);
	button.setIcon({path: "icon-active.png?2"});
	button.setBadgeText({text:feed.count===0?'':''+feed.count});
	button.setTitle({title:feed.title+'\n\n'+Summarise(feed.entries)});
	timeout = setTimeout(function() { Update(); }, 30000);
};


var Update = function() {
	if (timeout !== null) { clearTimeout(timeout); timeout = null; }
	var httpRequest = new XMLHttpRequest();
	var requestTimeout = window.setTimeout(function() { httpRequest.abort(); Failure('Error communicating with the server. Request timed out.'); }, 30000);
	httpRequest.onerror = function() { Failure('Error communicating with the server.'); };
	httpRequest.onreadystatechange = function() {
		if (httpRequest.readyState == 4) {
			window.clearTimeout(requestTimeout);
			if (httpRequest.status == 401)
				Failure('You are not logged in.');
			else if (httpRequest.status >= 400) 
				Failure('Error communicating with the server. HTTP status ' + httpRequest.status + '.');
			else if (httpRequest.responseXML)
				Success(httpRequest.responseXML);
			else
				Failure('Error communicating with the server. Invalid server response.');
		}
	};
	try {
		httpRequest.open('GET', 'https://mail.google.com/mail/u/0/feed/atom?'+Math.random(), true);
		httpRequest.send(null);
	}
	catch (exception) {
		Failure('Error communicating with the server.');
	}
};

Update();

