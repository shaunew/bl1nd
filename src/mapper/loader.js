
Blind.Mapper.loader = (function(){

	function promptReset() {
		bootbox.confirm('Are you sure you want to discard this map and start a new one?',
			function(result) {
				if (result) {
					reset();
				}
			}
		);
	}

	function reset() {
		Blind.Mapper.model.setMapState(null);
	}

	function getState() {
		return {
			version: 2,
			map: Blind.Mapper.getMapState(),
		};
	}

	function setState(state) {
		if (!state.version) {
			// backwards compatibility
			var state2 = {
				boxes: state.boxes,
			};
			Blind.Mapper.model.setMapState(state2);
		}
		else {
			Blind.Mapper.model.setMapState(state.map);
		}
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
		try {
			if (window.localStorage) {
				var state = JSON.parse(window.localStorage.mapperState);
				if (state) {
					setState(state);
					return true;
				}
			}
		}
		catch (e) {
		}
		return false;
	}

	function openFile(f) {
		var reader = new FileReader();
		reader.onload = function(e) {
			try {
				var state = JSON.parse(e.target.result);
				console.log(state);
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
		reset: reset,
		promptReset: promptReset,
	};
})();
