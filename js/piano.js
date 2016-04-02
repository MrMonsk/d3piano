(function(){

  // GLOBALS /////////////////////////////////////////////////////////////////

  var keyHeight = 100;
  var keyWidth = keyHeight * .2;
  var blackKeyHeight = keyHeight * 0.65;
  var blackKeyWidth = keyWidth * 0.5;
  var rounding = keyWidth * 0.1;
  var treble = d3.range(21,69);

  // STATE ///////////////////////////////////////////////////////////////////

  var mouseIsDown = false;

  // LISTENERS ///////////////////////////////////////////////////////////////

  function playNote(note){

    note.active = true;

    var delay = 0; // play one note every quarter second
    var midiNumber = note.keyNumber + 20; // the MIDI note
    var velocity = 127; // how hard the note hits

    // play the note
    MIDI.setVolume(0, 127);
    MIDI.noteOn(0, midiNumber, velocity, delay);
    MIDI.noteOff(0, midiNumber, delay + 0.75);

    // show the note on vexflow
    redrawStaffs(note);

  }

  // VEXFLOW /////////////////////////////////////////////////////////////////

  function redrawStaffs(note, type){

    // https://github.com/0xfe/vexflow/issues/134

    type = (type) ? type : "w";

    var letterName = (note.letterName.lastIndexOf(",") === -1) ? note.letterName : note.letterName.split(",")[1];

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

    // Create a voice in 4/4
    var voice = new Vex.Flow.Voice({
      num_beats: 4,
      beat_value: 4,
      resolution: Vex.Flow.RESOLUTION
    });

    var activeStaff, clef;

    if(note.keyNumber > 39){

      clef = "treble";
      activeStaff = topStaff;

    } else {

      clef = "bass";
      activeStaff = bottomStaff

    }

    // Add notes to voice
    voice.addTickables([ new Vex.Flow.StaveNote({ clef: clef, keys: [letterName], duration: type }) ]);

    // Format and justify the notes to 500 pixels
    var formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 500);

    voice.draw(ctx, activeStaff);

  }

  redrawStaffs({ keyNumber: 51, letterName: "b/4" }, "wr");

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

  // PIANO /////////////////////////////////////////////////////////////////

  var sortedNoteData = notes.sort(function(a, b){
    return (b.isBlack) ? -1 : 1;
  });

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
          note.hover = true;
          if(mouseIsDown){
            playNote(note);
          }
          redrawPiano();
        },
        mouseleave: function(note){
          note.hover = false;
          note.active = false;
          redrawPiano();
        },
        mousedown: function(note){
          playNote(note);
          mouseIsDown = true;
          redrawPiano();
        },
        mouseup: function(note){
          note.active = false;
          mouseIsDown = false;
          redrawPiano();
        },
        mouseout: function(note){
          note.active = false;
          redrawPiano();
        }
      });

    keys
      .attr({
        fill: function(d){

          if(d.active){
            return "#ccccff";
          }
          if(d.color){
            return d.color;
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

  redrawPiano();

})();

