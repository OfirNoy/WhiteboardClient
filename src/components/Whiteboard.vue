<template>
  <div class="whiteboard">
    <!-- <div id="main-display">       -->
      <div id="board">
        <canvas id="board-canvas" width="1000px" height="600">                    
        </canvas>
      </div>
      <div id="color-picker">
        <chrome-picker :value="colors" @input="updateLineColor">        
        </chrome-picker>        
      </div>
      <div class="selector">
        <select class="selector" :value="lineWidth" @change="updateLineWidth">
          <option value="2">2</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      </div>
      <div class="selector">
        <select id="selector" >
        </select>
      </div>      
    <!-- </div>     -->
  </div>
</template>

<script>
import { Chrome } from 'vue-color'
let wb = require('../js/whiteboard.js');

const BOARD_SELECTOR_ID = 'selector';
const BOARD_CANVAS = "board-canvas";
const WHITEBOARD_SERVICE_URL = "http://localhost:5000/board";

export default {
  name: 'Whiteboard',
  components: {
    'chrome-picker': Chrome
  },  
  data () {
    return {
      lineWidth: 2,
      colors: {
            hex: '#194d33e6',
            hsl: {
              h: 150,
              s: 0.5,
              l: 0.2,
              a: 0.9
            },
            hsv: {
              h: 150,
              s: 0.66,
              v: 0.30,
              a: 0.9
            },
            rgba: {
              r: 159,
              g: 96,
              b: 43,
              a: 0.9
            },
            a: 0.9
          },      
    }
  },
  methods:{
    updateLineWidth(event) {
      wb.setLineWidth(event.target.value);      
    },
    updateLineColor(value) {
      wb.setLineColor(value.hex);
    },    
    onNewBoard(boardId){
      var select = document.getElementById(BOARD_SELECTOR_ID);
      var option = document.createElement('option');
      option.text = option.value = boardId;
      select.add(option, 0);
    }
  },
  mounted: function () {      
    var canvas = document.getElementById(BOARD_CANVAS);
    wb.initWhiteboard(WHITEBOARD_SERVICE_URL, this.onNewBoard , canvas);

    var select = document.getElementById(BOARD_SELECTOR_ID);    
    var option = document.createElement('option');
    option.text = option.value = '';
    select.add(option, 0);
    select.addEventListener('change', (event) => {
        wb.setActiveBoardId(event.target.value);
    }); 
  }
}
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
#main-display{
  display: flex;
  width: 810px;
}
#color-picker{  
  padding-left: 5px;
}
#board-canvas{
  background-color: black;
}
.whiteboard{
  width: 1010px;  
}
#board-selector{
  position: relative;
  padding-left: 5px;
}
.selector{
  margin-top: 10px;  
  text-align: left;
}
</style>
