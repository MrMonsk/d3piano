(function(){

  var keyHeight = 200;
  var keyWidth = keyHeight * .2;
  var blackKeyHeight = keyHeight * 0.65;
  var blackKeyWidth = keyWidth * 0.5;
  var rounding = keyWidth * 0.1;

  var sortedNoteData = notes.sort(function(a, b){
    return (b.isBlack) ? -1 : 1;
  });

  var svg = d3.select("svg").attr({

    width: keyWidth * sortedNoteData.filter(function(note){ return !note.isBlack; }).length,
    height: keyHeight

  });

  var keys = svg.selectAll("rect").data(sortedNoteData, function(d) { return d.keyNumber; });

  keys.enter().append("rect")
    .attr({
      rx: rounding,
      ry: rounding,
      y: 0,
      x: function(d, i) { return d.keyPosition * keyWidth; },
      fill: function(d){
        return (d.isBlack) ? 'black' : 'white'
      },
      width:  function(d,i){
        return (d.isBlack) ? blackKeyWidth : keyWidth;
      },
      height: function(d,i){
        return (d.isBlack) ? blackKeyHeight : keyHeight;
      },
      stroke: "#AAAAAA"
    });

  keys.exit().remove();

})();