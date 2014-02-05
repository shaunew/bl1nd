
Blind.assets = (function(){

    var sfxSources = {
    };

    var songSources = {
    };

    var imageSources = {
        "eye": "img/eye.png",
        "title": "img/title.png",
        "menu_tutorial": "img/tutorial.png",
        "menu_play": "img/play.png",
        "menu_freerun": "img/freerun.png",
        "shift": "img/shift.png",
        "msg1": "img/msg1.png",
        "msg2": "img/msg2.png",
        "msg3": "img/msg3.png",
        "msg4": "img/msg4.png",
        "msg5": "img/msg5.png",
        "msg6": "img/msg6.png",
        "msg7": "img/msg7.png",
        "msg8": "img/msg8.png",
        "msg9": "img/msg9.png",
        "msg10": "img/msg10.png",
        "msg11": "img/msg11.png",
        "msg12": "img/msg12.png",
        "msg13": "img/msg13.png",
        "msg14": "img/msg14.png",
        "msg_wall00": "img/msg-wall00.png",
        "msg_wall01": "img/msg-wall01.png",
        "msg_wall02": "img/msg-wall02.png",
        "msg_hall00": "img/msg-hall00.png",
        "msg_hall01": "img/msg-hall01.png",
        "msg_hall02": "img/msg-hall02.png",
        "msg_corner00": "img/msg-corner00.png",
        "msg_corner01": "img/msg-corner01.png",
    };

    var jsonSources = {
        "map_title": "maps/title.json",
        "map_intro": "maps/intro.json",
        "map_intro_wall": "maps/intro-wall.json",
        "map_intro_hall": "maps/intro-hall.json",
        "map_intro_corner": "maps/intro-corner.json",
        "map_intro_wall": "maps/intro-wall.json",
        "map_intro_hall": "maps/intro-hall.json",
        "map_intro_corner": "maps/intro-corner.json",
        "map_intro_rooms": "maps/intro-rooms.json",
        "map_hook_intro": "maps/hook-intro.json",
        "map_hook_whip": "maps/hook-whip.json",
        "map_climb_intro": "maps/climb-intro.json",
        "map_climb_multi": "maps/climb-multi.json",
    };

    var json = {};

    // "Audio" objects for sfx
    var sfx = {};
    
    // post-processed song structures
    var songs = {};

    // "Image" objects, actual image file data
    var images = {};

    // post-processed image structures
    var fonts = {};

    function postProcess() {
    }

    function load(onLoad) {

        // Determine the number of files we are loading.
        var totalCount = 0;
        for (name in imageSources) { totalCount++; }
        for (name in jsonSources) { totalCount++; }
        for (name in sfxSources) { totalCount++; }
        for (name in songSources) { totalCount++; }

        // Running count of how many files have been loaded.
        var count = 0;


        // Called when all files are loaded.
        function handleAllDone() {
            postProcess();
            onLoad && onLoad();
        }

        if (count == totalCount) {
            handleAllDone();
        }

        // Called after a file is loaded.
        function handleLoad() {
            count++;
            //console.log(count, totalCount);
            if (count == totalCount) {
                handleAllDone();
            }
        }

        // Load images
        var img,name,src,req;
        for (name in imageSources) {
            if (images[name]) {
                handleLoad();
                continue;
            }
            src = imageSources[name];
            console.log('image',name, src);
            img = new Image();
            img.src = src;
            img.onerror = (function(name){
                return function() {
                    console.error("couldn't load image: "+ name);
                };
            })(name);
            img.onload = (function(name){
                return function() {
                    console.log("loaded image: "+ name);
                    handleLoad();
                };
            })(name);
            images[name] = img;
        }

        // Load json data.
        for (name in jsonSources) {
            if (json[name]) {
                handleLoad();
                continue;
            }
            src = jsonSources[name];
            req = new XMLHttpRequest();
            req.onload = (function(name){
                return function() {
                    try {
                        json[name] = JSON.parse(this.responseText);
                        console.log("loaded json: "+ name);
                        handleLoad();
                    }
                    catch (e) {
                        console.log("ERROR: could not load json file",name);
                        console.error("could not load json file",name);
                    }
                };
            })(name);
            req.open('GET', src, true);
            req.send();
        }

        // load sound effects
        var audio;
        for (name in sfxSources) {
            audio = new Audio();
            audio.src = sfxSources[name];
            sfx[name] = audio;
            console.log("loaded sfx: ", name);
            handleLoad();
        }

        // load songs and create song objects
        for (name in songSources) {
            audio = new Audio();
            src = songSources[name];
            if (audio.canPlayType('audio/ogg')) {
                audio.src = src+".ogg";
            }
            else if (audio.canPlayType('audio/mp3')) {
                audio.src = src+".mp3";
            }
            else {
                audio = null;
                console.error("no song found for: ", name);
                continue;
            }
            console.log("loaded song: ", name);
            songs[name] = new Blind.Song(audio);
            handleLoad();
        }
    }

    return {
        json: json,
        load: load,
        sfx: sfx,
        songs: songs,
        images: images,
        fonts: fonts,
    };
})();
