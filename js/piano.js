(function(){

  // GLOBALS /////////////////////////////////////////////////////////////////

  // artistic
  var keyHeight = 100;
  var keyWidth = keyHeight * .2;
  var blackKeyHeight = keyHeight * 0.65;
  var blackKeyWidth = keyWidth * 0.5;
  var rounding = keyWidth * 0.1;

  // configuration
  var treble = d3.range(21,69);
  var minKeyNumber = 20;
  var maxKeyNumber = 65;

  var eligibleNotes = notes.filter(function(it){
    return it.keyNumber > minKeyNumber && it.keyNumber < maxKeyNumber
  });

  var sortedNoteData = notes.sort(function(a, b){
    return (isBlack(b)) ? -1 : 1;
  });

  // STATE ///////////////////////////////////////////////////////////////////

  var activeNotes = [];
  var hoveredNote = null;
  var mouseIsDown = false;

  // HELPERS /////////////////////////////////////////////////////////////////

  function isBlack(note){
    return (note.keyPosition % 1) === 0.5;
  }

  function getRandomNote(notes){
    return notes[Math.floor(Math.random() * notes.length)];
  }

  // LISTENERS ///////////////////////////////////////////////////////////////

  document.getElementById("clear").onclick = clearActiveNotes;
  document.getElementById("redraw").onclick = redraw;
  document.getElementById("random").onclick = makeRandomSelection;

  function clearActiveNotes(){
    activeNotes = [];
    redraw();
  }

  function makeRandomSelection(){

    clearActiveNotes();

    switch(true){

      case (document.getElementById("chord").checked):

        var randomChord = chords[Math.floor(Math.random() * chords.length)];

        randomChord.keyNumbers.split(",").forEach(function(keyNumber){
          activeNotes.push(notes.find(function(it){ return it.keyNumber == keyNumber; }));
        });

        break;

      case (document.getElementById("note").checked):

        for(var i = 0; i < (Math.random() * 3); i ++){
          activeNotes.push(getRandomNote(eligibleNotes));
        }

        break;

      case (document.getElementById("interval").checked):

        var whiteNotes = eligibleNotes.filter(function(it){ return !isBlack(it); });

        var randomNote = getRandomNote(whiteNotes);
        var randomInterval = 1 + Math.floor(Math.random() * 7);

        var noteAtInterval = eligibleNotes.find(function(it){
          return it.keyPosition === (randomNote.keyPosition + randomInterval);
        });

        if(!noteAtInterval){
          noteAtInterval = eligibleNotes.find(function(it){
            return it.keyPosition === (randomNote.keyPosition - randomInterval);
          });
        }

        activeNotes.push(randomNote);
        activeNotes.push(noteAtInterval);

        break;

    }

    redraw();

  }

  function redraw(note){

    if(note && note.keyNumber){
      if(activeNotes.lastIndexOf(note) < 0){
        activeNotes.push(note);
      } else {
        activeNotes.splice(activeNotes.lastIndexOf(note), 1);
      }
    }

    activeNotes = activeNotes.sort(function(a,b){ return a.keyNumber - b.keyNumber; });

    redrawPiano();
    redrawStaffs();

    var activeNoteTextfields = document.getElementsByName('activeNotes');

    for(var i = 0; i < activeNoteTextfields.length; i++){
      activeNoteTextfields[i].value = "";
    }

    activeNotes.forEach(function(note, i){
      playNote(note);
      activeNoteTextfields[i].value = note.letterName.replace(/\/\d/g, "");
    });

    var activeNoteString = activeNotes.map(function(note){ return note.keyNumber; }).join(",");

    document.getElementById("activeKeys").value = activeNoteString;

    var activeChord = chords.find(function(it){
      return it.keyNumbers == activeNoteString;
    });

    document.getElementById("chordRoot").value = (activeChord) ? activeChord.letter : "";
    document.getElementById("chordType").value = (activeChord) ? activeChord.type : "";

    var numSemitones;

    if(activeNotes.length === 2){
      numSemitones = Math.abs(activeNotes[1].keyNumber - activeNotes[0].keyNumber);
    }

    if(numSemitones && numSemitones < 13){

      var interval = semitones.find(function(it){
        return it.semitones === numSemitones
      });

      document.getElementById("semitones").value = numSemitones;
      document.getElementById("currentInterval").value = interval.name;

    } else {

      document.getElementById("semitones").value = document.getElementById("currentInterval").value = "";

    }

  }

  redraw();

  // MIDI.js /////////////////////////////////////////////////////////////////

  MIDI.loadPlugin({
    soundfontUrl: "./bower_components/midi-js-soundfonts/FluidR3_GM/",
    instrument: "acoustic_grand_piano",
    onprogress: function (state, progress) {
      console.log(state, progress);
    },
    onsuccess: function() {
      console.log("loaded");
    }
  });

  function playNote(note){

    var delay = 0; // play one note every quarter second
    var midiNumber = note.keyNumber + 20; // the MIDI note
    var velocity = 127; // how hard the note hits

    // play the note
    MIDI.setVolume(0, 127);
    MIDI.noteOn(0, midiNumber, velocity, delay);
    MIDI.noteOff(0, midiNumber, delay + 0.75);

  }

  // VEXFLOW /////////////////////////////////////////////////////////////////

  function redrawStaffs(){

    // https://github.com/0xfe/vexflow/issues/134

    var canvas = document.getElementById("vexflow");

    var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
    var ctx = renderer.getContext();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var topStaff = new Vex.Flow.Stave(20, 60, 300);
    var bottomStaff = new Vex.Flow.Stave(20, 120, 300);

    topStaff.addClef('treble');
    bottomStaff.addClef('bass');

    topStaff.setContext(ctx).draw();
    bottomStaff.setContext(ctx).draw();

    var lineLeft = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(1);
    var lineRight = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(6);

    lineLeft.setContext(ctx).draw();
    lineRight.setContext(ctx).draw();

    var topVoice = new Vex.Flow.Voice({

      num_beats: 4,
      beat_value: 4,
      resolution: Vex.Flow.RESOLUTION

    });

    var bottomVoice = new Vex.Flow.Voice({

      num_beats: 4,
      beat_value: 4,
      resolution: Vex.Flow.RESOLUTION

    });

    var notesToLetterNames = function(note){
      return (note.letterName.lastIndexOf(",") === -1) ? note.letterName : note.letterName.split(",")[1];
    };

    var type = (activeNotes.length > 0) ? "w" : "wr";

    var topStaffNotes = activeNotes.filter(function(it){ return it.keyNumber > 39; });
    var bottomStaffNotes = activeNotes.filter(function(it){ return it.keyNumber <= 39; });

    if(topStaffNotes.length > 0){

      topVoice.addTickables([ new Vex.Flow.StaveNote({

        clef: "treble",
        keys: topStaffNotes.map(notesToLetterNames),
        duration: type

      }) ]);

      new Vex.Flow.Formatter().joinVoices([topVoice]).format([topVoice], 500);
      topVoice.draw(ctx, topStaff);

    }

    if(bottomStaffNotes.length > 0){

      bottomVoice.addTickables([ new Vex.Flow.StaveNote({

        clef: "bass",
        keys: bottomStaffNotes.map(notesToLetterNames),
        duration: type

      }) ]);

      new Vex.Flow.Formatter().joinVoices([bottomVoice]).format([bottomVoice], 500);
      bottomVoice.draw(ctx, bottomStaff);

    }

  }

  // PIANO /////////////////////////////////////////////////////////////////

  function redrawPiano(){

    var svg = d3.select("svg#piano").attr({

      width: keyWidth * sortedNoteData.filter(function(note){ return !isBlack(note); }).length,
      height: keyHeight

    });

    var keys = svg.selectAll("rect").data(sortedNoteData, function(d) { return d.keyNumber; });

    keys
      .enter()
      .append("rect")
      .attr({
        rx: rounding,
        ry: rounding,
        y: 0,
        x: function(d, i) {
          var keyPositionOffset = (isBlack(d)) ? 0.25 : 0;
          return (d.keyPosition + keyPositionOffset) * keyWidth;
        },
        width:  function(d,i){
          return (isBlack(d)) ? blackKeyWidth : keyWidth;
        },
        height: function(d,i){
          return (isBlack(d)) ? blackKeyHeight : keyHeight;
        },
        stroke: "#AAAAAA"

      })
      .on({
        mouseenter: function(note){
          hoveredNote = note;
          redrawPiano()
        },
        mouseleave: function(note){
          hoveredNote = null;
          redrawPiano()
        },
        mousedown: function(note){
          mouseIsDown = true;
          redraw(note);
        },
        mouseup: function(note){
          mouseIsDown = false;
        },
        mouseout: function(note){
          hoveredNote = null;
          redrawPiano()
        }
      });

    keys
      .attr({
        fill: function(d){

          if(activeNotes.lastIndexOf(d) > -1){
            return "#ccccff";
          }

          if(isBlack(d)){
            return (d === hoveredNote) ? '#444444' : '#000000';
          } else {
            return (d === hoveredNote) ? '#f2f2f2' : '#ffffff';
          }
        }
      });

    keys.exit().remove();

  }

})();

