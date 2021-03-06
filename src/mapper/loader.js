
Blind.Mapper.loader = (function(){

    function promptReset() {
        bootbox.confirm('Are you sure you want to discard this map and start a new one?',
            function(result) {
                if (result) {
                    setState(null);
                }
            }
        );
    }

    function getState() {
        return Blind.Mapper.model.getMapState();
    }

    function setState(state) {
        Blind.Mapper.model.setMapState(state);
        Blind.Mapper.setMode('play');
        backup();
    }

    function backup() {
        var state = getState();
        var stateStr = JSON.stringify(state,null,'\t');
        if (window.localStorage != undefined) {
            window.localStorage.mapperState = stateStr;
        }
        var btn = document.getElementById("save-button");
        btn.href = "data:application/json;base64," + btoa(stateStr);
        btn.download = "box.json";
    }

    function restore() {
        var state = null;
        try {
            state = JSON.parse(window.localStorage.mapperState);
            setState(state);
        }
        catch (e) {
            openLocal('map_intro_rooms');
        }
    }

    function openLocal(name) {
        setState(Blind.assets.json[name]);
    }

    function openFile(f) {
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var state = JSON.parse(e.target.result);
                setState(state);
            }
            catch (e) {
                bootbox.alert("Could not load file '"+f.name+"'");
            }
        };
        reader.readAsText(f);
    }

    // open file dialog
    function handleOpenFile(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.target.files;
        if (files) {
            openFile(files[0]);
        }
        else {
            files = evt.dataTransfer.files;
            if (files) {
                openFile(files[0]);
            }
        }
    }

    return {
        getState: getState,
        backup: backup,
        restore: restore,
        handleOpenFile: handleOpenFile,
        promptReset: promptReset,
        openLocal: openLocal,
    };
})();
