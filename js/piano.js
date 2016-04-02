(function(){

  // GLOBALS /////////////////////////////////////////////////////////////////

  var keyHeight = 100;
  var keyWidth = keyHeight * .2;
  var blackKeyHeight = keyHeight * 0.65;
  var blackKeyWidth = keyWidth * 0.5;
  var rounding = keyWidth * 0.1;
  var treble = d3.range(21,69);

  var sortedNoteData = notes.sort(function(a, b){
    return (b.isBlack) ? -1 : 1;
  });

  // STATE ///////////////////////////////////////////////////////////////////

  var activeNotes = [];
  var mouseIsDown = false;

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

    var eligibleNotes = notes.filter(function(it){ return it.keyNumber > 20 && it.keyNumber < 65 });

    for(var i = 0; i < (Math.random() * 3); i ++){
      activeNotes.push(eligibleNotes[Math.floor(Math.random() * eligibleNotes.length)])
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

    activeNotes.forEach(function(note){ playNote(note); });

    document.getElementById("activeNotes").value =
        activeNotes.map(function(note){ return note.letterName; }).join(",");

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

      width: keyWidth * sortedNoteData.filter(function(note){ return !note.isBlack; }).length,
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
          return d.keyPosition * keyWidth;
        },
        width:  function(d,i){
          return (d.isBlack) ? blackKeyWidth : keyWidth;
        },
        height: function(d,i){
          return (d.isBlack) ? blackKeyHeight : keyHeight;
        },
        stroke: "#AAAAAA"

      })
      .on({
        mouseenter: function(note){
        },
        mouseleave: function(note){
        },
        mousedown: function(note){
          mouseIsDown = true;
          redraw(note);
        },
        mouseup: function(note){
          mouseIsDown = false;
        },
        mouseout: function(note){
        }
      });

    keys
      .attr({
        fill: function(d){

          if(activeNotes.lastIndexOf(d) > -1){
            return "#ccccff";
          }

          if(d.isBlack){
            return (d.hover) ? '#444444' : '#000000';
          } else {
            return (d.hover) ? '#f2f2f2' : '#ffffff';
          }
        }
      });

    keys.exit().remove();

  }

})();

