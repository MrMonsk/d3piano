(function(){

  var keyWidth = 25;
  var keyHeight = 140;
  var blackKeyHeight = keyHeight * 0.65;
  var blackKeyWidth = keyWidth * 0.5;
  var rounding = keyWidth * 0.2;

  var sortedNoteData = notes.sort(function(a, b){
    return (b.isBlack) ? -1 : 1;
  });

  var svg = d3.select("svg").attr({
    width: keyWidth * sortedNoteData.filter(function(note){ return !note.isBlack; }).length,
    height: keyHeight
  });



  var circle = svg.selectAll("rect")
    .data(sortedNoteData, function(d) { return d.keyNumber; });

  circle.enter().append("rect")
    .attr({
      rx: rounding,
      ry: rounding
    })
    .attr("y", 0)
    .attr("x", function(d, i) { return d.keyPosition * keyWidth; })
    .attr("fill", function(d){
      return (d.isBlack) ? 'black' : 'white'
    })
    .attr("width", function(d,i){
      return (d.isBlack) ? blackKeyWidth : keyWidth;
    })
    .attr("height", function(d,i){
      return (d.isBlack) ? blackKeyHeight : keyHeight;
    })
    .attr("stroke", "#EEEEEE")

  circle.exit().remove();

})();