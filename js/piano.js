(function(){

  var keyHeight = 200;
  var keyWidth = keyHeight * .2;
  var blackKeyHeight = keyHeight * 0.65;
  var blackKeyWidth = keyWidth * 0.5;
  var rounding = keyWidth * 0.1;

  var mouseIsDown = false;

  var sortedNoteData = notes.sort(function(a, b){
    return (b.isBlack) ? -1 : 1;
  });

  function draw(){

    var svg = d3.select("svg").attr({

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
        stroke: "#AAAAAA",

      })
      .on({
        mouseenter: function(note){
          note.hover = true;
          if(mouseIsDown){
            note.active = true;
          }
          draw();
        },
        mouseleave: function(note){
          note.hover = false;
          draw();
        },
        mousedown: function(note){
          note.active = true;
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
            return "#ccffcc";
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

