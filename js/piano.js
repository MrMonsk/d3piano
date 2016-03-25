(function(){

  // VEXFLOW /////////////////////////////////////////////////////////////////

  var canvas = document.getElementById("vexflow");
  var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);

  var ctx = renderer.getContext();
  var stave = new Vex.Flow.Stave(10, 0, 500);
  stave.addClef("treble").setContext(ctx).draw();

  // Create the notes
  var vexNotes = [
    // A quarter-note C.
    new Vex.Flow.StaveNote({ keys: ["c/4"], duration: "q" }),

    // A quarter-note D.
    new Vex.Flow.StaveNote({ keys: ["d/4"], duration: "q" }),

    // A quarter-note rest. Note that the key (b/4) specifies the vertical
    // position of the rest.
    new Vex.Flow.StaveNote({ keys: ["b/4"], duration: "qr" }),

    // A C-Major chord.
    new Vex.Flow.StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" })
  ];

  // Create a voice in 4/4
  var voice = new Vex.Flow.Voice({
    num_beats: 4,
    beat_value: 4,
    resolution: Vex.Flow.RESOLUTION
  });

  // Add notes to voice
  voice.addTickables(vexNotes);

  // Format and justify the notes to 500 pixels
  var formatter = new Vex.Flow.Formatter().
    joinVoices([voice]).format([voice], 500);

  // Render voice
  voice.draw(ctx, stave);

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

  var keyHeight = 200;
  var keyWidth = keyHeight * .2;
  var blackKeyHeight = keyHeight * 0.65;
  var blackKeyWidth = keyWidth * 0.5;
  var rounding = keyWidth * 0.1;

  var mouseIsDown = false;

  var sortedNoteData = notes.sort(function(a, b){
    return (b.isBlack) ? -1 : 1;
  });

  function playNote(note){

    note.active = true;

    var delay = 0; // play one note every quarter second
    var note = note.keyNumber + 20; // the MIDI note
    var velocity = 127; // how hard the note hits

    // play the note
    MIDI.setVolume(0, 127);
    MIDI.noteOn(0, note, velocity, delay);
    MIDI.noteOff(0, note, delay + 0.75);

  }

  function draw(){

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
          draw();
        },
        mouseleave: function(note){
          note.hover = false;
          note.active = false;
          draw();
        },
        mousedown: function(note){
          playNote(note);
          mouseIsDown = true;
          draw();
        },
        mouseup: function(note){
          note.active = false;
          mouseIsDown = false;
          draw();
        },
        mouseout: function(note){
          note.active = false;
          draw();
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

  draw();

})();

