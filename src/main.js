
window.addEventListener('load', function() {
	Blind.canvas = document.getElementById('c');
	Blind.ctx = Blind.canvas.getContext('2d');

	var w = Blind.canvas.width = 720;
	var h = Blind.canvas.height = w/16*9;
	Blind.input.setBorderSize(20);

	(function loopYoutubeSong(){
		// Code taken from PuzzleScript:
		// (https://github.com/increpare/PuzzleScript/blob/master/js/engine.js#L650)
		var youtubeid = 'cRzZ0AdFHBs';
		var url = "https://youtube.googleapis.com/v/"+youtubeid+"?autoplay=1&loop=1&playlist="+youtubeid;
		ifrm = document.createElement("IFRAME");
		ifrm.setAttribute("src",url);
		ifrm.style.visibility="hidden";
		ifrm.style.width="500px";
		ifrm.style.height="500px";
		ifrm.style.position="absolute";
		ifrm.style.top="-1000px";
		ifrm.style.left="-1000px";
		document.body.appendChild(ifrm);
	})();

	Blind.assets.load(function(){
		Blind.input.init();
		Blind.setScene(Blind.scene_blare);
		Blind.executive.start();
	});
});

